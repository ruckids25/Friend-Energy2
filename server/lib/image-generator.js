// ==================================================
// Dynamic Image Generator (Canvas Profile Overlay)
// ==================================================

const { createCanvas, loadImage } = require("@napi-rs/canvas");
const axios = require("axios");

const BG_IMAGES = {
  1: "https://i.ibb.co/j9y1XGDC/1.jpg",
  2: "https://i.ibb.co/5hFJpTL1/2.jpg",
  3: "https://i.ibb.co/60P7VPLD/3.jpg",
  4: "https://i.ibb.co/XZWHVscg/4.jpg",
};

/**
 * Generate a dynamic card image overlaying the friend's profile picture.
 *
 * @param {number|string} bgIndex - Background image index (1-4)
 * @param {string} [profilePicUrl] - URL of tagged friend's profile photo
 * @param {string} [friendName] - Friend's name to write on image
 * @returns {Promise<Buffer>} JPEG image buffer
 */
async function generateCardImage(bgIndex, profilePicUrl, friendName) {
  const bgUrl = BG_IMAGES[bgIndex] || BG_IMAGES[1];

  // Load background image
  const bg = await loadImage(bgUrl);
  const canvas = createCanvas(bg.width, bg.height);
  const ctx = canvas.getContext("2d");

  // Draw background
  ctx.drawImage(bg, 0, 0, bg.width, bg.height);

  // Overlay profile picture if provided
  if (profilePicUrl) {
    try {
      const response = await axios.get(profilePicUrl, {
        responseType: "arraybuffer",
        timeout: 5000,
      });
      const avatar = await loadImage(Buffer.from(response.data));

      // Calculate circle position (center top half)
      const centerX = bg.width / 2;
      const centerY = bg.height * 0.42;
      const radius = Math.min(bg.width, bg.height) * 0.16;

      // Draw circular avatar
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(
        avatar,
        centerX - radius,
        centerY - radius,
        radius * 2,
        radius * 2
      );
      ctx.restore();

      // White border ring around avatar
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
      ctx.lineWidth = 10;
      ctx.strokeStyle = "#FFFFFF";
      ctx.stroke();
      ctx.restore();
    } catch (err) {
      console.warn("[ImageGen] ⚠️ Profile pic overlay warning:", err.message);
    }
  }

  return canvas.toBuffer("image/jpeg");
}

module.exports = {
  generateCardImage,
  BG_IMAGES,
};
