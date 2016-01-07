var cms = require('./bower_components/sdk/index.js');

var config = {};

if(process.env.PUBLIC) {
  config = {
    store: '568e50ea2016b75641bfc3c2',
    accessToken: '568e50f22016b75641bfc3cd',
  };
  var client = new cms.Client({
    store: config.store,
    accessToken: config.accessToken,
  });
} else {
  config = {
    host: 'localhost',
    store: '568e50ea2016b75641bfc3c2',
    accessToken: '568e50f22016b75641bfc3cd',
    port: '8080',
    secure: false
  };
  var client = new cms.Client({
    host: 'localhost',
    store: config.store,
    accessToken: config.accessToken,
    port: '8080',
    secure: false
  });
}



module.exports = client;