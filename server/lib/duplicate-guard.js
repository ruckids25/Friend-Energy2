// ==================================================
// OYOSHI Campaign — Duplicate Reply Guard
// ==================================================
// Prevents the bot from replying to the same comment twice.
// Uses an in-memory Set for simplicity.
//
// TODO: For production with multiple server instances,
// replace with Redis or a database-backed solution.
// ==================================================

class DuplicateGuard {
  constructor(maxSize = 10000) {
    this._processed = new Set();
    this._maxSize = maxSize;
  }

  /**
   * Check if a comment has already been processed.
   * @param {string} commentId
   * @returns {boolean}
   */
  hasProcessed(commentId) {
    return this._processed.has(commentId);
  }

  /**
   * Mark a comment as processed.
   * @param {string} commentId
   */
  markProcessed(commentId) {
    // Evict oldest entries if we exceed maxSize
    if (this._processed.size >= this._maxSize) {
      const first = this._processed.values().next().value;
      this._processed.delete(first);
    }
    this._processed.add(commentId);
  }

  /**
   * Get the number of processed comments.
   * @returns {number}
   */
  get size() {
    return this._processed.size;
  }
}

module.exports = new DuplicateGuard();
