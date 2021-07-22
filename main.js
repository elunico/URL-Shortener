const express = require('express');
const path = require('path');
const nedb = require('nedb');
const { promisify } = require('util');
require('dotenv').config();

const store = new nedb({
  filename: 'database.txt',
  autoload: true,
  timestampData: true,
});

store.ensureIndex({ fieldName: 'path', unique: true }, (err) => {

});

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

const findOne = promisify(store.findOne.bind(store));
const insert = promisify(store.insert.bind(store));

async function saveRecord(url, id, retryCount = 0) {
  try {
    let existing = await findOne({ url });
    if (existing) {
      console.log(existing);
      res.send({ path: existing.path });
    } else {
      await insert({ url, path: id });
      res.send({ path: id });
    }
  } catch (err) {
    if (err.errorType === 'uniqueViolated' && retryCount < Number(process.env.RETRY_COUNT || 100)) {
      saveRecord(url, generateID(), ++retryCount);
    } else {
      console.error(err);
      res.status(500).send(err);
    }
  }
}

app.post('/create', async (req, res) => {
  let { url } = req.body;
  if (!url) {
    res.status(400).sendFile(path.join(__dirname, 'views', '400.html'));
    return;
  }
  let id = generateID();
  await saveRecord(url, id);
});

app.get('/v/:id', async (req, res) => {
  try {
    if (!req.params.id) {
      res.status(400).sendFile(path.join(__dirname, 'views', '400.html'));
      return;
    }
    record = await findOne({ path: req.params.id });
    if (record) {
      res.redirect(record.url);
    } else {
      res.sendFile(path.join(__dirname, 'views', '404.html'));
    }
  } catch (err) {
    res.status(500).sendFile(path.join(__dirname, 'views', '500.html'));
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'new.html'));
});

app.listen(Numebr(process.env.PORT) || 8000, () => console.log("Listening..."));
