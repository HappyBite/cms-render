var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser({limit: '1mb'}));
var path = require('path');
var compression = require('compression');
var swig = require('swig');
var swigExtras = require('swig-extras');
var dotenv = require('dotenv').load();
// set config - has to be set before loading client
var nconf = require('nconf');
nconf.argv().env();
nconf.add('system', {type: 'file', file: 'dummy: has to be here to get set to work'});
try {
  nconf.set('config', require('./config.json'));
} catch (e) {
  // console.log(e);
}
var filters = require('./swig-extensions/filters.js');
var loadApplication = require('./load-application.js');
var session = require('express-session');

app.use(session({
  secret: 'ssshhhhh',
  resave: true,
  saveUninitialized: true
}));

// This is where all the magic happens!
app.engine('html', swig.renderFile);
swigExtras.useFilter(swig, 'markdown');

app.set('view engine', 'html');
app.set('views', __dirname + '/template');

// Swig will cache templates for you, but you can disable
// that and use Express's caching instead, if you like:
app.set('view cache', true);
// To disable Swig's cache, do the following:   
// NOTE: You should always cache templates in a production environment.
// Don't leave both of these to false in production!
swig.setDefaults({ cache: false });

app.set('port', (process.env.PORT || 5000));

// compress responses
app.use(compression());

// the static middleware must come after the sass middleware
var cacheFor = -1;
//if(process.env.PUBLIC) {
  // Strange flickering effect when caching files. Explore why this is happening.
  cacheFor = 86400000; // one day
//}
//app.use(express.static( path.join( __dirname, '/template/assets' ), { maxAge: cacheFor }));
app.use('/start-coding/assets', express.static( path.join( __dirname, 'start-coding/assets' ), { maxAge: cacheFor }));
app.use('/assets', express.static( path.join( __dirname, 'template/assets' ), { maxAge: cacheFor }));

loadApplication(app);

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});