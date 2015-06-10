var app = require('express')();
var swig = require('swig');

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

app.get('/', function (req, res) {
  res.render('index', { name: 'Swig templates are here to stay : )' });
});

app.listen(3000);
console.log('Application Started on http://localhost:3000');