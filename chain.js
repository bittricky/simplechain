/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');
const Storage = require('./storage');
const Block = require('./block');
let storage = new Storage();

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain {
  constructor() {
    this.chain = storage.db;
    this.getBlock(0)
      .then(() => console.log('GENESIS - ALREADY EXISTS'))
      .catch(() => this.addBlock(new Block(' GENESIS BLOCK - FIRST BLOCK IN THE CHAIN')));
  }

  // Add new block
  async addBlock(newBlock) {
    // Block height
    newBlock.height = await this.getBlockHeight()
                                .then(height => newBlock.height = (height + 1))
                                .catch(err => console.log(`ERROR: FAILED TO GET BLOCK HEIGHT DURING ADDING BLOCK ${err}`));

    console.log(`ADDING BLOCK ${newBlock.height} \n`);

    // Block Time
    newBlock.time = new Date().getTime().toString().slice(0, -3);

    // Previous Hash if Exists.
    if (newBlock.height >= 1) {
      await this.getBlock(newBlock.height - 1)
                .then(value => newBlock.previousBlockHash = storage.parseBlock(value).hash)
                .catch(err => console.log(`ERROR: FAILED TO GET PREVIOUS BLOCK HASH ${err}`));
    } else if (newBlock.height <= 0) {
      console.log('FIRST BLOCK - GENESIS IS OCCURING');
    }
    // New Hash
    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();

    // New Block added
    console.log('BLOCK ADDED', newBlock);
    storage.addLevelDBData(newBlock.height, JSON.stringify(newBlock).toString());
  }

  // Get block height
  async getBlockHeight() {
    return storage.getLevelDBHeight();
  }

  // get block
  async getBlock(blockHeight) {
    return storage.getLevelDBData(blockHeight);
  }

  // validate block
  async validateBlock(blockHeight) {
    return new Promise((resolve, reject) => {
      this.getBlock(blockHeight)
        .then(data => {
          let block = storage.parseBlock(data);
          // get hash
          let blockHash = block.hash;
          // clear hash
          block.hash = '';
          // generate block hash
          let validBlockHash = SHA256(JSON.stringify(block)).toString();
          // Compare
          if (validBlockHash === blockHash) {
            console.log(`BLOCK # ${blockHeight} VALID HASH: ${blockHash} === ${validBlockHash} \n`);
            resolve(true);
          } else {
            console.log(`BLOCK # ${blockHeight} INVALID HASH: ${blockHash} !== ${validBlockHash} \n`);
            resolve(false);
          }
        })
        .catch(err => {
          console.log(`ERROR: FAILED TO VALIDATE SINGLE BLOCK ${err}`);
          reject(err);
        });
    });
  }

  // Validate blockchain
  async validateChain() {
    let errorLog = [],
        height = await this.getBlockHeight();

    for (let i = 0; i <= height; i++) {
      let valid = await this.validateBlock(i),
          blockHash = undefined,
          previousHash = undefined;

          await this.getBlock(i)
                    .then(value => blockHash = storage.parseBlock(value).hash)
                    .catch(err => console.log(`ERROR: FAILED TO GET CURRENT BLOCK HASH ${err}`));

      if (i !== 0) {
        await this.getBlock(i - 1)
                  .then(value => previousHash = storage.parseBlock(value).previousBlockHash)
                  .catch(err => console.log(`ERROR: FAILED TO GET THE PREVIOUS BLOCK HASH ${err}`));
      }

      if (blockHash !== previousHash) {
        if (!valid) errorLog.push({ height: i, valid, });
      }
    }

    if (errorLog.length > 0) {
      console.log(`BLOCK ERRORS ${errorLog.length}`);
      errorLog.forEach(error => console.log(`VALIDATION ERROR: ${error}`));
    } else {
      console.log('NO ERRORS');
    }
  }
}

// Testing the Chain

let blockchain = new Blockchain();

(function theLoop(i) {
  setTimeout(function() {
    blockchain.addBlock(new Block("test data " + i));
    if (--i)
      theLoop(i);
    }
  , 100);
})(10);
