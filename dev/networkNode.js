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
  const blockIndex = tina.createNewTransaction(
    req.body.amount,
    req.body.sender,
    req.body.recipient
  );
  res.json({ note: `Transaction will be added in block ${blockIndex}.` });
});

app.post('transactions/broadcast', (req, res) => {
  
})

app.get('/mine', (req, res) => {
  const lastBlock = tina.getLastBlock();
  const previousBlockHash = lastBlock['hash'];

  const currentBlockData = {
    transactions: tina.pendingTransactions,
    index: lastBlock['index'] + 1
  };

  const nonce = tina.proofOfWork(previousBlockHash, currentBlockData);
  const blockHash = tina.hashBlock(previousBlockHash, currentBlockData, nonce);

  tina.createNewTransaction(12.5, '00', nodeAddress);

  const newBlock = tina.createNewBlock(nonce, previousBlockHash, blockHash);
  res.json({ note: `New block mined successfully`, block: newBlock });
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
        newNodeUrl
      },
      json: true
    };
    registerNodesPromises.push(rp(requestOptions));
  });
  Promise.all(registerNodesPromises)
    .then(data => {
      const bulkRegisterOptions = {
        uri: `${newNodeUrl}/register-nodes-bulk`,
        method: 'POST',
        body: { allNetworkNodes: [...tina.networkNodes, tina.currentNodeUrl] },
        json: true
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

  res.json({note: 'Bulk registration successful.'})
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
