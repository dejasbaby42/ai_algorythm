const algosdk = require('algosdk');
const { PICAOS_API_KEY } = require('./constants');

const algodClient = new algosdk.Algodv2(
  '', // No token needed for public API
  'https://mainnet-api.4160.nodely.io',
  '' // No port needed for public API
);

const indexerClient = new algosdk.Indexer(
  '', // No token needed for public API
  'https://mainnet-idx.4160.nodely.io',
  '' // No port needed for public API
);

const picaosConfig = {
  apiKey: PICAOS_API_KEY
};

module.exports = {
  algodClient,
  indexerClient,
  picaosConfig
};
