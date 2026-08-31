// ==================================================
// OYOSHI Campaign Server — Main Entry Point
// ==================================================
// Express server that handles Facebook Webhooks
// for the "Tag Your Good Energy Friend" campaign.
//
// Flow:
// 1. Facebook sends a webhook when someone comments on a Page post
// 2. We extract the tagged friend name from the comment
// 3. We generate a random Personality Type + Score
// 4. We reply to the comment with the result
// ==================================================

require("dotenv").config();

const express = require("express");
const facebook = require("./lib/facebook");
const campaign = require("./lib/campaign");
const duplicateGuard = require("./lib/duplicate-guard");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Middleware ----------

// We need raw body for signature verification, but also parsed JSON
app.use(
  express.json({
    verify: (req, _res, buf) => {
      // Store raw body buffer for webhook signature verification
      req.rawBody = buf;
    },
  })
);

// ---------- Health Check ----------

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    campaign: "OYOSHI — Tag Your Good Energy Friend",
    processedComments: duplicateGuard.size,
    uptime: Math.floor(process.uptime()),
  });
});

// ---------- Webhook Verification (GET) ----------
// Facebook sends a GET request to verify our webhook endpoint.
// We must respond with the hub.challenge value if the verify token matches.

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
// Facebook sends POST requests here when events happen (new comments, etc.)

app.post("/webhook", async (req, res) => {
  // Step 1: Respond immediately (Facebook requires < 3 second response)
  res.status(200).send("EVENT_RECEIVED");

  // Step 2: Verify signature (security — ensure request is from Facebook)
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

  // Step 3: Process events
  const body = req.body;
  if (body.object !== "page") return;

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== "feed") continue;

      const value = change.value;

      // Only process new comments (not edits, deletes, etc.)
      if (value.item !== "comment" || value.verb !== "add") continue;

      await handleNewComment(value, entry.id);
    }
  }
});

// ---------- Comment Handler Logic ----------

async function handleNewComment(commentData, pageId) {
  const commentId = commentData.comment_id;
  const senderId = commentData.sender_id;
  const senderName = commentData.sender_name;
  const messageText = commentData.message || "";

  console.log(
    `[Comment] 💬 New comment from ${senderName} (${senderId}): "${messageText}"`
  );

  // Guard: Don't reply to our own comments (prevent infinite loop!)
  if (senderId === process.env.FB_PAGE_ID || senderId === pageId) {
    console.log("[Comment] ⏭️ Skipping — comment is from our own Page");
    return;
  }

  // Guard: Don't process the same comment twice
  if (duplicateGuard.hasProcessed(commentId)) {
    console.log(`[Comment] ⏭️ Skipping — comment ${commentId} already processed`);
    return;
  }

  // Guard: Check if this is for a specific campaign post only
  if (
    process.env.CAMPAIGN_POST_ID &&
    commentData.post_id !== process.env.CAMPAIGN_POST_ID
  ) {
    console.log("[Comment] ⏭️ Skipping — not on the campaign post");
    return;
  }

  // Mark as processed immediately to prevent race conditions
  duplicateGuard.markProcessed(commentId);

  try {
    // Step 1: Get full comment details with message_tags
    let messageTags = [];
    try {
      const details = await facebook.getCommentDetails(commentId);
      messageTags = details.message_tags || [];
    } catch (err) {
      console.warn(
        `[Comment] ⚠️ Could not fetch comment details: ${err.message}`
      );
      // Continue with raw text parsing as fallback
    }

    // Step 2: Extract the friend name
    const friendName = campaign.extractFriendName(messageText, messageTags);

    if (!friendName) {
      console.log(
        "[Comment] ⏭️ Skipping — could not extract friend name from comment"
      );
      return;
    }

    console.log(`[Comment] 🎯 Extracted friend name: "${friendName}"`);

    // Step 3: Generate personality result
    const result = campaign.generateResult(friendName);
    console.log(
      `[Comment] ✨ Result: ${result.personality.type} — ${result.score}%`
    );

    // Step 4: Format the reply message
    const replyMessage = campaign.formatReplyMessage(
      result.friendName,
      result.personality,
      result.score
    );

    // Step 5: Delay before replying (avoid spam detection)
    const delay = parseInt(process.env.REPLY_DELAY_MS || "3000", 10);
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Step 6: Reply to the comment
    const reply = await facebook.replyToComment(commentId, replyMessage);
    console.log(`[Comment] ✅ Successfully replied! Reply ID: ${reply.id}`);
  } catch (error) {
    console.error(`[Comment] ❌ Error processing comment ${commentId}:`, error.message);

    // Log Graph API error details if available
    if (error.response?.data?.error) {
      console.error("[Comment] Facebook API Error:", error.response.data.error);
    }
  }
}

// ---------- Utility: Subscribe Page to Webhooks ----------
// Run this once: node -e "require('./index'); fetch('http://localhost:3000/subscribe-page')"

app.post("/subscribe-page", async (_req, res) => {
  const pageId = process.env.FB_PAGE_ID;
  if (!pageId) {
    return res.status(400).json({ error: "FB_PAGE_ID not set in .env" });
  }

  try {
    const result = await facebook.subscribePageWebhook(pageId);
    res.json({ success: true, result });
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message, details: error.response?.data });
  }
});

// ---------- Start Server ----------

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║   ⚡ OYOSHI Campaign Server                      ║
║   Tag Your Good Energy Friend                    ║
╠══════════════════════════════════════════════════╣
║   🌐 Server:    http://localhost:${PORT}            ║
║   🔗 Webhook:   /webhook                         ║
║   💚 Health:    /health                           ║
╚══════════════════════════════════════════════════╝
  `);

  // Warn if critical env vars are missing
  if (!process.env.FB_PAGE_ACCESS_TOKEN) {
    console.warn("⚠️  FB_PAGE_ACCESS_TOKEN is not set — webhook replies will fail!");
    console.warn("   See SETUP_GUIDE.md for instructions.\n");
  }
  if (!process.env.FB_APP_SECRET) {
    console.warn("⚠️  FB_APP_SECRET is not set — webhook signature verification disabled!\n");
  }
});
