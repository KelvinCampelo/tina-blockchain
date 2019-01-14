const sha256 = require('sha256');
const uuid = require('uuid/v1');
const currentNodeUrl = process.argv[3];

function TinaBlockchain() {
    this.chain = [];
    this.pendingTransactions = [];

    this.currentNodeUrl = currentNodeUrl;
    this.networkNodes = [];

    this.createNewBlock(100, 'bigBangBlock', 'genesisBlock');
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
        previousBlockHash,
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
        recipient,
        transactionId: uuid()
            .split('-')
            .join(''),
    };

    return newTransaction;
};

TinaBlockchain.prototype.addTransactionToPendingTransactions = function(
    transactionObject
) {
    this.pendingTransactions.push(transactionObject);
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

TinaBlockchain.prototype.chainIsValid = function(blockchain) {
    let validChain = true;
    
    for (var i = 1; i < blockchain.length; i++) {
        const currentBlock = blockchain[i];
        const previousBlock = blockchain[i - 1];
        const blockHash = this.hashBlock(
            previousBlock['hash'],
            {
                transactions: currentBlock['transactions'],
                index: currentBlock['index'],
            },
            currentBlock['nonce']
        );

        if (blockHash !== currentBlock['hash']) {
            validChain = false;
        }

        if (blockHash.substring(0, 4) !== '0000') {
            validChain = false;
        }

        if (currentBlock['previousBlockHash'] !== previousBlock['hash']) {
            validChain = false;
        }
    }

    const genesisBlock = blockchain[0];

    const correctNonce = genesisBlock['nonce'] === 100;
    const correctPreviousBlockHash =
        genesisBlock['previousBlockHash'] === 'bigBangBlock';
    const correctHash = genesisBlock['hash'] === 'genesisBlock';
    const correctTransactions = genesisBlock['transactions'].length === 0;

    if (
        !correctNonce ||
        !correctPreviousBlockHash ||
        !correctHash ||
        !correctTransactions
    ) {
        validChain = false;
    }
    return validChain;
};

module.exports = TinaBlockchain;
