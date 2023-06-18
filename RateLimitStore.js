const limiter = require('express-rate-limit');
const sql = require('sqlite3');

class RateLimitStore {
  constructor(windowMS, max) {
    this.windowMS = windowMS;
    this.max = max;

    this.rateLimitStore = new sql.Database(`/home/thomas/url-shortener/url-database.sqlite3`, err => {
      if (err) {
        console.error(`Failed to open rate limit database ${err}`);
      }
    });

    function keyGenerator(req) {
      // default behavior for express-rate-limit
      return req.ip;
    }

    let msg = { success: false, reason: 'Too many requests!' };
    this.rateLimiter = limiter({
      message: msg,
      max: this.max,
      windowMs: this.windowMS,
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
  }

  incr(key, cb) {
    this.rateLimitStore.get('SELECT * from agent where id=?', [key], (err, row) => {
      if (err) {
        console.error(`Error incrementing ${key}`);
        console.error(err);
        cb(err, -1, new Date());
      } else if (row) {
        this.rateLimitStore.run(`UPDATE agent
        SET count=?
        WHERE
            id=?`, [row.count + 1, key], err => {
          console.error(err);
          cb(err, row.count, row.expires);
        });
      } else {
        let d = new Date(Date.now() + 1000 * 60 * 5);
        this.rateLimitStore.run(`INSERT INTO agent (id, count, expires) VALUES (?, ?, ?)`, [key, 1, d], (err) => {
          console.error(err);
          cb(err, 1, d);

        });
      }
    });
  }

  decr(key) {
    this.rateLimitStore.run(`UPDATE table
        SET count=?
        WHERE
            key=?`, [row.count - 1, key], err => {
      console.error(err);
    });
  }

  resetKey(key) {
    this.rateLimitStore.run(`DELETE FROM agent WHERE id=?`, [key], err => {
      console.error(err);
    });
  }
}

module.exports = RateLimitStore;
