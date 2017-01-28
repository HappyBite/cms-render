var conf = require('nconf');
var config = conf.get('config');

var bucketId = config && config.env && config.env.bucket_id ?
               config.env.bucket_id :
               process.env.BUCKET_ID;
var accessToken = config && config.env && config.env.access_token ?
                  config.env.access_token :
                  process.env.ACCESS_TOKEN;

if(process.env.NODE_ENV) {
  // var cms = require('./bower_components/sdk/index.js');
  var cms = require('twixly');
  var client = new cms.Client({
    bucket: bucketId,
    accessToken: accessToken
  });
} else {
  // var cms = require('../sdk/index.js');
  var cms = require('../sdk/index.js');
  var client = new cms.Client({
    host: 'localhost',
    bucket: bucketId,
    accessToken: accessToken,
    port: '8080',
    secure: false
  });
}

module.exports = client;