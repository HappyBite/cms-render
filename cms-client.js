var cms = require('../sdk/index.js');

var config = {};

config = {
  store: '568e50ea2016b75641bfc3c2',
  accessToken: '568e50f22016b75641bfc3cd',
  port: '80',
  secure: true
}

// config = {
//   store: '568e50ea2016b75641bfc3c2',
//   accessToken: '568e50f22016b75641bfc3cd',
//   port: '8080',
//   secure: false
// }


var client = new cms.Client({
  store: config.store,
  accessToken: config.accessToken,
  port: config.port,
  secure: config.secure
})

module.exports = client;