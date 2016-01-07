var cms = require('../sdk/index.js');

var client = new cms.Client({
  store: '568d8047aa56b51f0a83409d',
  accessToken: '568d804caa56b51f0a8340a5',
  port: 8080,
  secure: false
})

module.exports = client;