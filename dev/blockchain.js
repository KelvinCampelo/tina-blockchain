function TinaBlockchain() {
  this.chain = [];
  this.newTransactions = [];
}

TinaBlockchain.prototype.createNewBlock = function(nonce, previousBlockHash, hash) {
  const newBlock = {
    index: this.chain.length + 1,
    timestamp: Date.now(),
    transactions: this.newTransactions,
    nonce,
    hash,
    previousBlockHash
  };

  this.newTransactions = [];
  this.chain.push(newBlock);

  return newBlock;
};

TinaBlockchain.prototype.getLastBlock = function() {
    return this.chain[this.chain.length - 1]
}

module.exports = TinaBlockchain;
