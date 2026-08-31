// ==================================================
// OYOSHI Campaign — Personality Logic & Message Formatting
// ==================================================
// Campaign-specific logic: extracting friend names,
// generating personality results, and formatting reply messages.
// ==================================================

const PERSONALITY_TYPES = [
  {
    type: "THE HYPE FRIEND",
    emoji: "🔥",
    desc: "คนที่พร้อมเติมไฟให้คุณเสมอ",
  },
  {
    type: "THE COMFORT FRIEND",
    emoji: "🤗",
    desc: "ไม่ต้องพูดเยอะก็เข้าใจกัน",
  },
  {
    type: "THE CHAOS FRIEND",
    emoji: "🤪",
    desc: "อยู่ด้วยกันทีไร ไม่มีคำว่าสงบ",
  },
  {
    type: "THE ADVENTURE FRIEND",
    emoji: "🏔️",
    desc: "คนที่พร้อมไปทุกที่ด้วยกัน",
  },
];

/**
 * Extract tagged friend name(s) from a comment.
 *
 * Strategy (ordered by reliability):
 * 1. Use message_tags from Graph API (most reliable)
 * 2. Parse @mentions from raw text
 * 3. Fall back to the entire comment text (cleaned)
 *
 * @param {string} commentText - Raw comment text
 * @param {Array} messageTags - message_tags array from Graph API (optional)
 * @returns {string|null} Extracted friend name, or null if nothing found
 */
function extractFriendName(commentText, messageTags = []) {
  // Strategy 1: Use Graph API message_tags
  if (messageTags && messageTags.length > 0) {
    // Pick the first tagged user (exclude the Page itself)
    const tag = messageTags.find((t) => t.type === "user");
    if (tag && tag.name) {
      return tag.name.trim();
    }
  }

  // Strategy 2: Parse @mentions from raw text
  // Captures the first word right after @ (works for Thai nicknames: @มิ้นท์, @แพรว)
  // For full names with spaces, Strategy 1 (message_tags) is more reliable
  const atMentionRegex = /@([\p{L}\p{M}\p{N}_.]+)/gu;
  const matches = [...(commentText || "").matchAll(atMentionRegex)];
  if (matches.length > 0) {
    return matches[0][1].trim();
  }

  // Strategy 3: Fall back — clean and use the whole comment
  // (for cases where user just types "มิ้นท์" without @)
  const cleaned = (commentText || "")
    .replace(/#\S+/g, "") // Remove hashtags
    .replace(/https?:\/\/\S+/g, "") // Remove URLs
    .trim();

  if (cleaned.length > 0 && cleaned.length <= 40) {
    return cleaned;
  }

  return null;
}

/**
 * Generate a random campaign result for a friend.
 *
 * @param {string} friendName - The friend's name
 * @returns {{ friendName: string, personality: object, score: number }}
 */
function generateResult(friendName) {
  const personality =
    PERSONALITY_TYPES[Math.floor(Math.random() * PERSONALITY_TYPES.length)];
  const score = Math.floor(Math.random() * 15) + 85; // 85–99%

  return { friendName, personality, score };
}

/**
 * Format the reply message with personality result.
 *
 * @param {string} friendName
 * @param {object} personality - { type, emoji, desc }
 * @param {number} score - Good Energy Score (85-99)
 * @returns {string} Formatted reply message
 */
function formatReplyMessage(friendName, personality, score) {
  // Build a visual score bar
  const filled = Math.round(score / 5);
  const empty = 20 - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);

  return [
    `⚡ GOOD ENERGY RESULT ⚡`,
    ``,
    `${friendName} คือ...`,
    ``,
    `${personality.emoji} ${personality.type}`,
    `${personality.desc}`,
    ``,
    `Good Energy Score: ${score}%`,
    `${bar} ${score}%`,
    ``,
    `🎁 ส่ง OYOSHI ให้เพื่อนดีๆ ของคุณ!`,
    `#OYOSHI #GoodEnergy #TagYourFriend`,
  ].join("\n");
}

module.exports = {
  PERSONALITY_TYPES,
  extractFriendName,
  generateResult,
  formatReplyMessage,
};
