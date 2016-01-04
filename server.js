var express = require('express');
var app = express();
var swig = require('swig');
var filters = require('./swig-extensions/filters.js');
var loadApplication = require('./load-application.js');

// set config 
var nconf = require('nconf');
nconf.argv().env();
nconf.add('system', {type: 'file', file: 'dummy: has to be here for get set to work'});

// This is where all the magic happens!
app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', __dirname + '/views');

// Swig will cache templates for you, but you can disable
// that and use Express's caching instead, if you like:
app.set('view cache', false);
// To disable Swig's cache, do the following:   
swig.setDefaults({ cache: false });
// NOTE: You should always cache templates in a production environment.
// Don't leave both of these to false in production!

app.set('port', (process.env.PORT || 5000));
app.use('/public', express.static(__dirname + '/public'));

loadApplication(app);

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});