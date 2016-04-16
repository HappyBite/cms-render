if(process.env.NODE_ENV) {
  var cms = require('./bower_components/sdk/index.js');
  var client = new cms.Client({
    bucket: process.env.BUCKET_ID,
    accessToken: process.env.ACCESS_TOKEN
  });
} else {
  var cms = require('../sdk/index.js');
  var client = new cms.Client({
    host: 'localhost',
    bucket: process.env.BUCKET_ID,
    accessToken: process.env.ACCESS_TOKEN,
    port: '8080',
    secure: false
  });
}

module.exports = client;