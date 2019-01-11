function Tina() {
  this.chain = [];
  this.newTransactions = [];
}

Tina.prototype.createNewBlock = (nonce, previousBlockHash, hash) => {
  const newBlock = {
    index: this.chain.length + 1,
    timestamp: Date.now(),
    transactions: this.newTransactions,
    nonce,
    hash,
    previousBlockHash
  };

  this.newTransactions = []
  this.chain.push(newBlock)

  return newBlock;
};
