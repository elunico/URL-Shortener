const express = require('express');
const path = require('path');
const RateLimitStore = require('./RateLimitStore');
// const child = require('child_process');
// const fs = require('fs');
const dotenv = require('dotenv').config();

const createLimitStore = new RateLimitStore(1000 * 60 * 60, 50, 'cragent');
const redirectLimitStore = new RateLimitStore(1000 * 60, 1000, 'rdagent');
const app = express();
const sqlite = require('sqlite3');
console.log(__dirname + '/.env');
console.log(dotenv);
const sqlStore = new sqlite.Database('/home/thomas/url-shortener/url-database.sqlite3', err => {
  if (err) {
    console.error("Could not open database!");
    process.exit(120);
  } else {
    console.log("Database opened");
    process.on('exit', () => {
      db.close((err) => {
        if (err) {
          console.error(err.message);
        }
        console.log('Close the database connection.');
      });
    });
  }
});



app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(path.join(__dirname, '/static')));
app.use(express.json());


const candidateString = 'abcdefghijklmnopqrstuvwxyz' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + '0123456789-_';

function generateID() {
  let id = '';
  for (let i = 0; i < 6; i++) {
    let index = Math.floor((Math.random() * candidateString.length));
    id += candidateString.charAt(index);
  }
  return id;
}

function invalid(url) {
  try {
    let u = new URL(url);
    if (u.protocol.indexOf('http') !== 0) {
      throw 'Invalid protocol';
    }
    return false;
  } catch (err) {
    return true;
  }
}

function sqlSaveRecord(url, id, retryCount = 100) {
  return new Promise((resolve, reject) => {
    if (retryCount <= 0) return reject({ success: false, err: "Failed to find unique identifier: too many attempts" });
    sqlStore.get('SELECT * from urls where url=?', [url], (err, row) => {
      if (err) {
        console.error(err.message);
        reject({ success: false, err: "Database malfunction" });
      } else if (!row) {
        sqlStore.get('SELECT * FROM urls WHERE path=?', [id], (err, rows) => {
          if (err) {
            reject({ success: false, err: "Database malfunction" });
          } else if (rows) {
            sqlSaveRecord(url, generateID(), retryCount - 1).then(resolve).catch(reject);
          } else {
            sqlStore.run('INSERT into urls (url, path, createdAt) values (?, ?, ?)', [url, id, Date.now()], (err) => {
              if (err) {
                console.error(err);
                reject({ success: false, err: "Database malfunction" });
              } else {
                console.log(`Inserted ${url} with path ${id}`);
                resolve({ success: true, path: id });
              }
            });
          }
        });
      } else {
        resolve({ success: true, path: row.path });
      }

    });
  });
}

app.get('/coffee', redirectLimitStore.rateLimiter, async (req, res) => {
  res.status(418).sendFile(path.join(__dirname, 'views', 'teapot.html'));
});

app.post('/create', createLimitStore.rateLimiter, async (req, res) => {
  let { url } = req.body;
  if (!url) {
    res.status(400).send({ success: false, reason: "Missing URL" });
    return;
  }
  if (invalid(url)) {
    res.status(400).send({ success: false, reason: 'invalid or malformed URL' });
    return;
  }
  let id = generateID();
  try {
    let answer = await sqlSaveRecord(url, id);
    console.log(answer);
    res.status(201).send({ success: true, path: answer.path });
  } catch (error) {
    res.status(500).send({ success: false, err: error.err });
  }
});

app.get('/now', async (req, res) => {
  let now = new Date(Date.now());
  let date = now.getDate();

  let name = '';
  if (date == 1)
    name = 'kalendae';
  else if (date > 1 && date <= 7)
    name = `${(date - 1)} diēs post kalendās`;
  else if (date > 7 && date <= 14)
    name = `${(date - 1)} diēs ante īdūs`;
  else if (date == 15)
    name = `īdū`;
  else if (date > 15)
    name = `${(date - 1)} diēs post īdūs`;

  let day = 'diēs ';
  day += [
    'Sōlis', 'Lūnae', 'Mārtis', 'Mercuriī', 'Iovis', 'Veneris', 'Saturnī'
  ][now.getDay()];

  let daytime = `${day}, ${name}`;

  let month = 'mēnsis ';

  month += [
    'Iānuārius', 'Februārius', 'Martius', 'Aprīlis', 'Māius', 'Iūnius', 'Iūlius', 'Augustus', 'September', 'Octōber', 'November', 'December'
  ][now.getMonth()];

  let year = now.getFullYear() - -753;

  let yeartime = `${year} a.U.C`;

  let result = `${daytime}, ${month} ${yeartime}\n`;

  res.send(result);
});

async function getURL(path) {
  return new Promise((resolve, reject) => {
    sqlStore.get('SELECT * from urls where path=?', [path], (err, row) => {
      if (err) {
        console.error(err.message);
        reject(null);
      }
      if (!row) {
        console.error("No such url with " + path);
        resolve(null);
      } else {
        resolve(row);
      }

    });
  });
}


app.get('/q/:id', redirectLimitStore.rateLimiter, async (req, res) => {
  try {
    if (!req.params.id) {
      res.status(400).sendFile(path.join(__dirname, 'views', '400.html'));
      return;
    }
    record = await getURL(req.params.id); //urlStore.findOne({ path: req.params.id });
    if (record) {
      res.render('check.pug', { url: record.url, path: record.path, created: record.createdAt });
    } else {
      res.sendFile(path.join(__dirname, 'views', '404.html'));
    }
  } catch (err) {
    res.status(500).sendFile(path.join(__dirname, 'views', '500.html'));
  }
});

app.get('/v/:id', redirectLimitStore.rateLimiter, async (req, res) => {
  try {
    if (!req.params.id) {
      res.status(400).sendFile(path.join(__dirname, 'views', '400.html'));
      return;
    }
    record = await getURL(req.params.id); //urlStore.findOne({ path: req.params.id });
    if (record) {
      res.redirect(record.url);
    } else {
      res.sendFile(path.join(__dirname, 'views', '404.html'));
    }
  } catch (err) {
    res.status(500).sendFile(path.join(__dirname, 'views', '500.html'));
  }
});

app.get('/no/:request', (req, res) => {
  res.redirect(`https://app.eluni.co/no/${req.params.request}`);
});

app.get('/', redirectLimitStore.rateLimiter, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'new.html'));
});

app.listen(Number(process.env.PORT || 4000), () => {
  console.log("URL Shortener Listening...");
  console.log("Trying to drop GID");
  console.log(`port listening is ${process.env.PORT}, ${Number(process.env.PORT || 4000)}`);
  //  process.setgid(20);
  console.log(`GID=${process.getgid()}`);
});
