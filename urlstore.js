const nedb = require('nedb');
const { promisify } = require('util');

class URLStore {
  constructor() {
    this.urlStore = new nedb({
      filename: '/home/thomas/url-shortener/database.txt',
      autoload: true,
      timestampData: true,
    });


    this.urlStore.ensureIndex({ fieldName: 'path', unique: true }, (err) => {
      if (err) {
        console.error("Could not create index for path. Fatal Error.");
        console.error(err);
        process.exit(1);
      }
    });

    this.urlStore.ensureIndex({ fieldName: 'url', unique: false }, (err) => {
      if (err) {
        console.warn("Could not create index for url field!");
        console.warn(err);
      }
    });
  }

  async findOne(query) {
    return promisify(this.urlStore.findOne.bind(this.urlStore))(query);
  }

  async insert(doc) {
    return promisify(this.urlStore.insert.bind(this.urlStore))(doc);
  }
}

module.exports = URLStore;
