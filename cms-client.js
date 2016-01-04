var cms = require('../sdk/index.js');

var client = new cms.Client({
  store: '568a79075c3cea9b114be12f',
  accessToken: '568a790b5c3cea9b114be13b',
  port: 8080,
  secure: false
})

module.exports = client;