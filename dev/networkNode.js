const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const TinaBlockchain = require('./blockchain');
const uuid = require('uuid/v1');
const port = process.argv[2];
const rp = require('request-promise');

const nodeAddress = uuid()
    .split('-')
    .join('');

const tina = new TinaBlockchain();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/blockchain', (req, res) => {
    res.send(tina);
});

app.post('/transactions', (req, res) => {
    const blockIndex = tina.addTransactionToPendingTransactions(req.body);
    res.json({ note: `Transaction will be added in block ${blockIndex}.` });
});

app.post('/transactions/broadcast', (req, res) => {
    const newTransaction = tina.createNewTransaction(
        req.body.amount,
        req.body.sender,
        req.body.recipient
    );

    tina.addTransactionToPendingTransactions(newTransaction);

    const requestPromises = [];
    tina.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/transactions',
            method: 'POST',
            body: newTransaction,
            json: true,
        };

        requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises).then(data => {
        res.json({ note: 'Transaction created and broadcast successfully.' });
    });
});

app.get('/mine', (req, res) => {
    const lastBlock = tina.getLastBlock();
    const previousBlockHash = lastBlock['hash'];

    const currentBlockData = {
        transactions: tina.pendingTransactions,
        index: lastBlock['index'] + 1,
    };

    const nonce = tina.proofOfWork(previousBlockHash, currentBlockData);
    const blockHash = tina.hashBlock(
        previousBlockHash,
        currentBlockData,
        nonce
    );

    const newBlock = tina.createNewBlock(nonce, previousBlockHash, blockHash);

    const requestPromises = [];
    tina.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/receive-new-block',
            method: 'POST',
            body: { newBlock },
            json: true,
        };

        requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises)
        .then(data => {
            const requestOptions = {
                uri: tina.currentNodeUrl + '/transactions/broadcast',
                method: 'POST',
                body: {
                    amount: 12.5,
                    sender: '00',
                    nodeAddress,
                },
                json: true,
            };
            return rp(requestOptions);
        })
        .then(data => {
            res.json({
                note: `New block mined & broadcast successfully`,
                block: newBlock,
            });
        });
});

app.post('/receive-new-block', (req, res) => {
    const newBlock = req.body.newBlock;
    const lastBlock = tina.getLastBlock();

    const correctLastBlockHash = lastBlock.hash === newBlock.previousBlockHash;
    const correctIndex = lastBlock['index'] + 1 === newBlock['index'];

    if (correctLastBlockHash && correctIndex) {
        tina.chain.push(newBlock);
        tina.pendingTransactions = [];

        res.json({ note: 'New block received and accepted', newBlock });
    } else {
        res.json({ note: 'New block rejected.', newBlock });
    }
});

app.post('/register-and-broadcast-node', (req, res) => {
    const newNodeUrl = req.body.newNodeUrl;
    if (tina.networkNodes.indexOf(newNodeUrl) == -1)
        tina.networkNodes.push(newNodeUrl);

    const registerNodesPromises = [];
    tina.networkNodes.forEach(networkNode => {
        const requestOptions = {
            uri: `${networkNode}/register-node`,
            method: 'post',
            body: {
                newNodeUrl,
            },
            json: true,
        };
        registerNodesPromises.push(rp(requestOptions));
    });
    Promise.all(registerNodesPromises)
        .then(data => {
            const bulkRegisterOptions = {
                uri: `${newNodeUrl}/register-nodes-bulk`,
                method: 'POST',
                body: {
                    allNetworkNodes: [
                        ...tina.networkNodes,
                        tina.currentNodeUrl,
                    ],
                },
                json: true,
            };
            return rp(bulkRegisterOptions);
        })
        .then(data => {
            res.json({ note: 'New node registered with network successfully' });
        })
        .catch(error => {
            res.status(500).send(error);
        });
});

app.post('/register-node', (req, res) => {
    const newNodeUrl = req.body.newNodeUrl;
    if (
        tina.networkNodes.indexOf(newNodeUrl) == -1 &&
        tina.currentNodeUrl !== newNodeUrl
    ) {
        tina.networkNodes.push(newNodeUrl);
    }
    res.json({ note: 'New node registered successfully with node.' });
});

app.post('/register-nodes-bulk', (req, res) => {
    const allNetworkNodes = req.body.allNetworkNodes;
    allNetworkNodes.forEach(networkNodeUrl => {
        if (
            tina.networkNodes.indexOf(networkNodeUrl) == -1 &&
            tina.currentNodeUrl !== networkNodeUrl
        ) {
            tina.networkNodes.push(networkNodeUrl);
        }
    });

    res.json({ note: 'Bulk registration successful.' });
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
