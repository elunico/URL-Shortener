const nedb = require('nedb');
const limiter = require('express-rate-limit');

class RateLimitStore {
  constructor() {
    this.rateLimitStore = new nedb({
      store: null,
      filename: '/home/thomas/url-shortener/rate-limit.txt',
      autoload: true,
      timestampData: true,
    });

    function keyGenerator(req) {
      // default behavior for express-rate-limit
      return req.ip;
    }

    let msg = { success: false, reason: 'Too many requests!' };
    this.rateLimiter = limiter({
      message: msg,
      max: 50, // up to 50 URLs shortened every 5 minutes
      windowMs: 1000 * 60 * 5, // 5 minutes in millis
      store: this,
      keyGenerator: keyGenerator,
      handler: (req, res, next) => {
        if (Date.now() >= req.rateLimit.resetTime.getTime()) {
          this.resetKey(keyGenerator(req));
          next();
        } else {
          res.status(429).send(msg);
        }
      }
    });
    this.rateLimitStore.persistence.setAutocompactionInterval(30000);
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
              cb(err, 1, d);
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
    this.rateLimitStore.remove({ key }, {}, (err, n) => {
      if (err) {
        console.error(err);
      }
    });
  }
}

module.exports = RateLimitStore;
