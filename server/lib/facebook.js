// ==================================================
// OYOSHI Campaign — Facebook Graph API Client
// ==================================================
// Handles all communication with the Facebook Graph API:
// - Webhook signature verification
// - Reading comment details
// - Replying to comments
// ==================================================

const crypto = require("crypto");
const axios = require("axios");

const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Verify the X-Hub-Signature-256 header from Facebook webhook requests.
 * This ensures the request actually came from Facebook and wasn't spoofed.
 *
 * @param {Buffer} rawBody - The raw request body as a Buffer
 * @param {string} signature - The X-Hub-Signature-256 header value
 * @param {string} appSecret - Your Facebook App Secret
 * @returns {boolean} Whether the signature is valid
 */
function verifyWebhookSignature(rawBody, signature, appSecret) {
  if (!signature || !appSecret) {
    console.warn("[FB] Missing signature or app secret — skipping verification");
    return false;
  }

  const expectedSig =
    "sha256=" +
    crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSig)
  );
}

/**
 * Get the Page Access Token from environment.
 * @returns {string}
 */
function getPageToken() {
  let token = process.env.FB_PAGE_ACCESS_TOKEN || "";
  token = token.trim().replace(/^["']|["']$/g, "").trim();
  if (!token) {
    throw new Error(
      "FB_PAGE_ACCESS_TOKEN is not set. See SETUP_GUIDE.md for instructions."
    );
  }
  return token;
}

/**
 * Fetch comment details from the Graph API.
 * Includes message, message_tags, from, and attachment data.
 *
 * @param {string} commentId - The comment ID
 * @returns {Promise<object>} Comment data
 */
async function getCommentDetails(commentId) {
  const url = `${GRAPH_API_BASE}/${commentId}`;
  const response = await axios.get(url, {
    params: {
      fields: "id,message,message_tags,from,created_time,attachment,parent",
      access_token: getPageToken(),
    },
  });
  return response.data;
}

/**
 * Reply to a comment on a Page post.
 * @param {string} commentId
 * @param {string} message
 * @param {string} [attachmentUrl] - Optional image URL to attach
 * @returns {Promise<object>} Response data containing comment reply ID
 */
async function replyToComment(commentId, message, attachmentUrl = null) {
  const token = getPageToken();

  const payload = {
    message,
    access_token: token,
  };

  if (attachmentUrl) {
    payload.attachment_url = attachmentUrl;
  }

  const response = await axios.post(
    `https://graph.facebook.com/v21.0/${commentId}/comments`,
    payload
  );

  console.log(
    `[FB] ✅ Replied to comment ${commentId} → new reply ID: ${response.data.id}`
  );
  return response.data;
}

/**
 * Subscribe a Page to receive webhook events for the `feed` field.
 * Call this once after getting the Page Access Token.
 *
 * @param {string} pageId - The Facebook Page ID
 * @returns {Promise<object>}
 */
async function subscribePageWebhook(pageId) {
  const url = `${GRAPH_API_BASE}/${pageId}/subscribed_apps`;
  const response = await axios.post(url, null, {
    params: {
      subscribed_fields: "feed",
      access_token: getPageToken(),
    },
  });
  console.log(`[FB] ✅ Page ${pageId} subscribed to feed webhooks`);
  return response.data;
}

module.exports = {
  verifyWebhookSignature,
  getCommentDetails,
  replyToComment,
  subscribePageWebhook,
  GRAPH_API_VERSION,
};
