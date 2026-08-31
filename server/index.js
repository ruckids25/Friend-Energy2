// ==================================================
// OYOSHI Campaign Server — Main Entry Point
// ==================================================
// Express server that handles Facebook Page comment auto-reply
// for the "Tag Your Good Energy Friend" campaign.
//
// Dual Engine:
// 1. Webhooks (Real-time webhook listener)
// 2. Auto-Poll Engine (Fetches new page comments every 5s)
//    -> Bypasses Meta Webhook App Review restrictions!
// ==================================================

require("dotenv").config();

const express = require("express");
const axios = require("axios");
const facebook = require("./lib/facebook");
const campaign = require("./lib/campaign");
const duplicateGuard = require("./lib/duplicate-guard");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Middleware ----------

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// ---------- Health & Privacy Check ----------

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    campaign: "OYOSHI — Tag Your Good Energy Friend",
    processedComments: duplicateGuard.size,
    uptime: Math.floor(process.uptime()),
  });
});

app.get("/privacy", (_req, res) => {
  res.send(`
    <html>
      <head><title>Privacy Policy - OYOSHI Campaign</title></head>
      <body style="font-family:sans-serif; padding:40px; line-height:1.6;">
        <h2>Privacy Policy for OYOSHI Good Energy Campaign</h2>
        <p>This application processes public Facebook Page comments to generate fun campaign results ("Tag Your Good Energy Friend").</p>
        <p>No personal user data is permanently stored or shared with third parties.</p>
      </body>
    </html>
  `);
});

// ---------- Webhook Verification (GET) ----------

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.FB_VERIFY_TOKEN) {
    console.log("[Webhook] ✅ Verification successful");
    return res.status(200).send(challenge);
  }

  console.warn("[Webhook] ❌ Verification failed — token mismatch");
  return res.sendStatus(403);
});

// ---------- Webhook Handler (POST) ----------

app.post("/webhook", async (req, res) => {
  res.status(200).send("EVENT_RECEIVED");

  const signature = req.headers["x-hub-signature-256"];
  if (process.env.FB_APP_SECRET) {
    const isValid = facebook.verifyWebhookSignature(
      req.rawBody,
      signature,
      process.env.FB_APP_SECRET
    );
    if (!isValid) {
      console.warn("[Webhook] ❌ Invalid signature — ignoring request");
      return;
    }
  }

  const body = req.body;
  if (body.object !== "page") return;

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== "feed") continue;

      const value = change.value;
      if (value.item !== "comment" || value.verb !== "add") continue;

      await handleNewComment({
        comment_id: value.comment_id,
        sender_id: value.sender_id,
        sender_name: value.sender_name,
        message: value.message || "",
        post_id: value.post_id,
      }, entry.id);
    }
  }
});

// ---------- Comment Processor ----------

async function handleNewComment(commentData, pageId) {
  const commentId = commentData.comment_id;
  const senderId = commentData.sender_id;
  const senderName = commentData.sender_name || "User";
  const messageText = commentData.message || "";

  // Guard: Don't process the same comment twice
  if (duplicateGuard.hasProcessed(commentId)) {
    return;
  }

  // Guard: Don't reply to our own page comments
  if (senderId === process.env.FB_PAGE_ID || senderId === pageId) {
    duplicateGuard.markProcessed(commentId);
    return;
  }

  // Guard: Specific post filter if configured
  if (
    process.env.CAMPAIGN_POST_ID &&
    commentData.post_id !== process.env.CAMPAIGN_POST_ID
  ) {
    return;
  }

  // Mark as processed immediately to prevent race conditions
  duplicateGuard.markProcessed(commentId);

  try {
    console.log(
      `[Comment] 💬 New comment from ${senderName}: "${messageText}"`
    );

    // Get full details if messageTags not provided
    let messageTags = commentData.message_tags || [];
    if (!messageTags.length) {
      try {
        const details = await facebook.getCommentDetails(commentId);
        messageTags = details.message_tags || [];
      } catch (_e) {
        // Use raw text fallback
      }
    }

    // Extract friend name
    const friendName = campaign.extractFriendName(messageText, messageTags);

    if (!friendName) {
      console.log(
        `[Comment] ⏭️ Skipping comment ${commentId} — no friend name found`
      );
      return;
    }

    console.log(`[Comment] 🎯 Extracted friend name: "${friendName}"`);

    // Generate personality result
    const result = campaign.generateResult(friendName);
    console.log(
      `[Comment] ✨ Result: ${result.personality.type} — ${result.score}%`
    );

    // Format reply message
    const replyMessage = campaign.formatReplyMessage(
      result.friendName,
      result.personality,
      result.score
    );

    // Reply delay
    const delay = parseInt(process.env.REPLY_DELAY_MS || "2000", 10);
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Send reply via Graph API
    const reply = await facebook.replyToComment(commentId, replyMessage);
    console.log(`[Comment] ✅ Successfully replied! Reply ID: ${reply.id}`);
  } catch (error) {
    console.error(
      `[Comment] ❌ Error processing comment ${commentId}:`,
      error.response?.data || error.message
    );
  }
}

// ---------- Auto-Poll Engine ----------
// Continuously checks for new comments on Page posts every 5 seconds.
// Bypasses Facebook Webhook Review restrictions!

async function pollPageComments() {
  const pageId = process.env.FB_PAGE_ID;
  const token = process.env.FB_PAGE_ACCESS_TOKEN;

  if (!pageId || !token) return;

  try {
    const url = `https://graph.facebook.com/v21.0/${pageId}/published_posts`;
    const response = await axios.get(url, {
      params: {
        fields: "id,comments{id,message,from,message_tags,created_time}",
        limit: 5,
        access_token: token,
      },
    });

    const posts = response.data.data || [];

    for (const post of posts) {
      const comments = post.comments?.data || [];
      for (const comment of comments) {
        const commentId = comment.id;
        const senderId = comment.from?.id;

        // Skip if already processed or from page itself
        if (
          duplicateGuard.hasProcessed(commentId) ||
          senderId === pageId
        ) {
          duplicateGuard.markProcessed(commentId);
          continue;
        }

        await handleNewComment(
          {
            comment_id: commentId,
            sender_id: senderId,
            sender_name: comment.from?.name || "User",
            message: comment.message || "",
            message_tags: comment.message_tags || [],
            post_id: post.id,
          },
          pageId
        );
      }
    }
  } catch (error) {
    if (error.response?.data?.error?.code === 190) {
      console.warn("⚠️ Page Access Token expired — please update FB_PAGE_ACCESS_TOKEN");
    }
  }
}

// Poll every 5 seconds
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || "5000", 10);
setInterval(pollPageComments, POLL_INTERVAL_MS);

// ---------- Start Server ----------

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║   ⚡ OYOSHI Campaign Server (Dual Engine)       ║
║   Tag Your Good Energy Friend                    ║
╠══════════════════════════════════════════════════╣
║   🌐 Server:    http://localhost:${PORT}            ║
║   🔗 Webhook:   /webhook                         ║
║   🔄 Polling:   Every ${POLL_INTERVAL_MS / 1000}s                   ║
║   💚 Health:    /health                           ║
╚══════════════════════════════════════════════════╝
  `);

  // Run initial poll check after 2 seconds
  setTimeout(pollPageComments, 2000);
});
