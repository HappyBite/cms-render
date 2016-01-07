var cms = require('../sdk/index.js');

var client = new cms.Client({
  store: '568e50ea2016b75641bfc3c2',
  accessToken: '568e50f22016b75641bfc3cd',
  port: 8080,
  secure: false
})

module.exports = client;