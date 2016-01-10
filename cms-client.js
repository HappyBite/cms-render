var cms = require('./bower_components/sdk/index.js');
//var cms = require('../sdk/index.js');

//console.log('Store ID: ' + process.env.STORE_ID);
//console.log('Access Token: ' + process.env.ACCESS_TOKEN);

if(process.env.PUBLIC) {
  var client = new cms.Client({
    store: process.env.STORE_ID,
    accessToken: process.env.ACCESS_TOKEN
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