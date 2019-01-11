const sha256 = require('sha256');

function TinaBlockchain() {
  this.chain = [];
  this.pendingTransactions = [];

  this.createNewBlock(0, 'bigBangBlock', 'genesisBlock');
}

TinaBlockchain.prototype.createNewBlock = function(
  nonce,
  previousBlockHash,
  hash
) {
  const newBlock = {
    index: this.chain.length + 1,
    timestamp: Date.now(),
    transactions: this.pendingTransactions,
    nonce,
    hash,
    previousBlockHash
  };

  this.pendingTransactions = [];
  this.chain.push(newBlock);

  return newBlock;
};

TinaBlockchain.prototype.getLastBlock = function() {
  return this.chain[this.chain.length - 1];
};

TinaBlockchain.prototype.createNewTransaction = function(
  amount,
  sender,
  recipient
) {
  const newTransaction = {
    amount,
    sender,
    recipient
  };

  this.pendingTransactions.push(newTransaction);

  return this.getLastBlock()['index'] + 1;
};

TinaBlockchain.prototype.hashBlock = function(
  previousBlockHash,
  currentBlockData,
  nonce
) {
  const dataAsString = `${previousBlockHash}${nonce.toString()}${JSON.stringify(
    currentBlockData
  )}`;

  const hash = sha256(dataAsString);

  return hash;
};

TinaBlockchain.prototype.proofOfWork = function(
  previousBlockHash,
  currentBlockData
) {
  let nonce = 0;
  let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);

  while (hash.substring(0, 4) !== '0000') {
    nonce++;
    hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
  }

  return nonce;
};

module.exports = TinaBlockchain;
