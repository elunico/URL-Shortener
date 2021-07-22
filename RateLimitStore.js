const nedb = require('nedb');
const limiter = require('express-rate-limit');

class RateLimitStore {
  constructor() {
    this.rateLimitStore = new nedb({
      store: null,
      filename: 'rate-limit.txt',
      autoload: true,
      timestampData: true,
    });
    this.rateLimiter = limiter({
      message: { success: false, reason: 'Too many requests!' },
      max: 50, // up to 50 URLs shortened every 5 minutes
      windowMs: 1000 * 60 * 5, // 5 minutes in millis
      store: this
    });
  }

  incr(key, cb) {
    this.rateLimitStore.findOne({ key }, (err, doc) => {
      if (err) {
        console.error(`Error incrementing ${key}`);
        console.err(err);
        cb(err, -1, new Date());
      } else if (doc) {
        this.rateLimitStore.update(
          { key },
          { $inc: { count: 1 } },
          { upsert: true },
          (err, num, upsert) => {
            cb(err, doc.count, doc.expires);
          }
        );
      } else {
        let d = new Date(Date.now() + 1000 * 60 * 5);
        this.rateLimitStore.insert(
          { key, count: 1, expires: d },
          (err, doc) => {
            if (err) {
              console.error(`Error incrementing ${key}`);
              console.err(err);
              cb(err, -1, new Date());
            } else {
              cb(err, doc.count, doc.expires);
            }
          }
        );
      }
    });
  }

  decr(key) {
    this.rateLimitStore.update({ key }, { $dec: { count: 0 } }, { upsert: false }, (err, num, upsert) => {
      if (err) {
        // guess I'll die?
        console.error(err);
      }
    });
  }

  resetKey(key) {
    this.rateLimitStore.update({ key }, { $set: { count: 0 } }, { upsert: false }, (err, num, upsert) => {
      if (err) {
        // guess I'll die?
        console.error(err);
      }
    });
  }
}

module.exports = RateLimitStore;
