const express = require('express');
const path = require('path');
const URLStore = require('./urlstore');
const RateLimitStore = require('./RateLimitStore');
require('dotenv').config();

const createLimitStore = new RateLimitStore(1000 * 60 * 60, 50, 'create-limit.txt');
const redirectLimitStore = new RateLimitStore(1000 * 60, 1000, 'redirect-limit.txt');
const urlStore = new URLStore();
const app = express();

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

async function saveRecord(req, res, url, id, retryCount = 0) {
  try {
    let existing = await urlStore.findOne({ url });
    if (existing) {
      console.log(existing);
      res.send({ success: true, path: existing.path });
    } else {
      await urlStore.insert({ url, path: id });
      res.send({ success: true, path: id });
    }
  } catch (err) {
    if (err.errorType === 'uniqueViolated' && retryCount < Number(process.env.RETRY_COUNT || 100)) {
      await saveRecord(req, res, url, generateID(), ++retryCount);
    } else {
      console.error(err);
      res.status(500).send({ success: false, err });
    }
  }
}

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
  await saveRecord(req, res, url, id);
});

app.get('/v/:id', redirectLimitStore.rateLimiter, async (req, res) => {
  try {
    if (!req.params.id) {
      res.status(400).sendFile(path.join(__dirname, 'views', '400.html'));
      return;
    }
    record = await urlStore.findOne({ path: req.params.id });
    if (record) {
      res.redirect(record.url);
    } else {
      res.sendFile(path.join(__dirname, 'views', '404.html'));
    }
  } catch (err) {
    res.status(500).sendFile(path.join(__dirname, 'views', '500.html'));
  }
});

app.get('/', redirectLimitStore.rateLimiter, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'new.html'));
});

app.listen(Number(process.env.PORT || 80), () => {
  console.log("Listening...");
  console.log("Trying to drop GID");
  console.log(`port listening is ${process.env.PORT}, ${Number(process.env.PORT || 8000)}`);
  //  process.setgid(20);
  console.log(`GID=${process.getgid()}`);
});
