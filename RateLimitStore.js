const limiter = require('express-rate-limit');
const sql = require('sqlite3');

class RateLimitStore {
  constructor(windowMS, max, table) {
    this.windowMS = windowMS;
    this.max = max;
    this.table = table;

    this.rateLimitStore = new sql.Database(`/home/thomas/url-shortener/url-database.sqlite3`, err => {
      if (err) {
        console.error(`Failed to open rate limit database ${err}`);
      }
    });

    let msg = { success: false, reason: 'Too many requests!' };
    this.rateLimiter = limiter({
      message: msg,
      max: this.max,
      windowMs: this.windowMS,
      store: this,
      keyGenerator: (request) => {
        return request.header('x-forwarded-for')
      },
    });
  }

  incr(key, cb) {
    this.rateLimitStore.get(`SELECT * from ${this.table} where id=?`, [key], (err, row) => {
      if (err) {
        console.error(`Error incrementing ${key}`);
        console.error(err);
        cb(err, -1, new Date());
      } else if (row) {
        this.rateLimitStore.run(`UPDATE ${this.table}
        SET count=?
        WHERE
            id=?`, [row.count + 1, key], err => {
          console.error(err);
          cb(err, row.count, row.expires);
        });
      } else {
        let d = new Date(Date.now() + 1000 * 60 * 5);
        this.rateLimitStore.run(`INSERT INTO ${this.table} (id, count, expires) VALUES (?, ?, ?)`, [key, 1, d.getTime()], (err) => {
          console.error(err);
          cb(err, 1, d);

        });
      }
    });
  }

  decr(key) {
    this.rateLimitStore.run(`UPDATE ${this.table}
        SET count=?
        WHERE
            key=?`, [row.count - 1, key], err => {
      console.error(err);
    });
    console.log("Decrementing " + key);
  }

  resetKey(key) {
    this.rateLimitStore.run(`DELETE FROM ${this.table} WHERE id=?`, [key], err => {
      console.error(err);
    });
    console.log("Resetting " + key);
  }
}

module.exports = RateLimitStore;
