var cms = require('./bower_components/sdk/index.js');

if(process.env.PUBLIC) {
  var client = new cms.Client({
    store: process.env.STORE_ID,
    accessToken: process.env.ACCESS_TOKEN,
  });
} else {
  var client = new cms.Client({
    host: 'localhost',
    store: process.env.STORE_ID,
    accessToken: process.env.ACCESS_TOKEN,
    port: '8080',
    secure: false
  });
}

module.exports = client;