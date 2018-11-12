const level = require('level');
const chainDB = './chaindata';

class Storage {
  constructor() {
    this.db = level(chainDB);
  }

  // Add data to levelDB with key/value pair
  addLevelDBData(key, value) {
    let self = this;
    return new Promise(function(resolve, reject) {
      self.db.put(key, value, function(err) {
        if (err) {
          console.log(`BLOCK ${key} FAILED SUBMISSION: ${err}`);
          reject(err);
        }
        resolve(value);
      });
    });
  }

  // Get data from levelDB with key
  getLevelDBData(key) {
    let self = this;
    return new Promise((resolve, reject) => {
      self.db.get(key, function(err, value) {
        if (err) {
          console.log(`ERROR: DATA NOT FOUND ${err}`);
          reject(err);
        }
        console.log(value);
        resolve(value);
      });
    });
  }

  getLevelDBHeight() {
    let self = this,
        height = 0;
    return new Promise((resolve, reject) => {
      self.db.createReadStream()
        .on('data', function(data) { height++; })
        .on('error', function(err) {
          return console.log(`ERROR: FAILED TO GET CHAIN HEIGHT ${err}`);
          reject(err);
        })
        .on('close', function() {
          height = height - 1;
          resolve(height);
        });
    })
  }

  // Add data to levelDB with value
  addDataToLevelDB(value) {
    let self = this;
    let dataArray = [];
    return new Promise((resolve, reject) => {
      self.db.createReadStream()
        .on('data', function(data) {
          dataArray.push(data);
        }).on('error', function(err) {
          return console.log(`UNABLE TO READ DATA STREAM: ${err}`)
        }).on('close', function() {
          resolve(dataArray);
        });
    });
  }

  parseBlock(block) {
    return (typeof block === 'string') ? JSON.parse(block) : block;
  }
}

module.exports = Storage;
