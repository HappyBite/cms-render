var swig = require('swig');
var async = require('async');
var client = require('./cms-client.js'); 
var conf = require('nconf');

module.exports = function(app) {
  // app.use(function(req, res, next) {
  //   var url = req.url;
  //   var lastCharOnUrl = url.substring(url.length - 1, url.length); 
  //   if(lastCharOnUrl !== '/') {
  //     url = url + '/'
  //     res.redirect(301, url);
  //   } else {
  //     next();
  //   }
  // });

  app.use(function(req, res, next) {   
    // if (req.headers['git_hook'] || (req.body && req.body.git_hook) || req.query.git_hook) {
    //   //app.cache = {};
    //   //process.exit(1);
    //   res.header('Cache-Control', 'max-age=0, must-revalidate');
    //   res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    //   res.header('Expires', '-1');
    //   res.header('Pragma', 'no-cache');
    //   res.removeHeader('Content-Length');
    //   res.removeHeader('Cache-Control');
    //   res.setHeader('X-Hijacked', 'yes!');
    //   res.status('304').send('Git hook executed!!!');
    //   return false;
    // }
    if (!conf.get('items')) { 
      console.log('This will only show once!');
      async.parallel({
        item_types: function(callback) {
          client.itemTypes({}, function(err, itemTypes) {
            if (err) {
              callback(err);
            } else {
              callback(null, itemTypes);
            }
          });
        },
        items: function(callback) {
          client.items({}, function(err, items) {
            if (err) {
              callback(err);
            } else {
              callback(null, items);
            }
          });
        },
        meta: function(callback) {
          client.meta({}, function(err, items) {
            if (err) {
              callback(err);
            } else {
              callback(null, items);
            }
          });
        }
      },
      function(err, results) {
        var items = results.items;
        var itemTypes = results.item_types;
        var meta = results.meta;
        conf.set('items', items);
        conf.set('item_types', itemTypes);
        conf.set('meta', meta);
        if(typeof items === 'undefined') {
          console.log('Failed connection to the API');
          res.send('Failed connection to the API');
          return false;
        }
        // Items dictionary
        var item_dictionary = {};
        var startPage;
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          item_dictionary[item.id] = item;
          if(item.attributes.start_page) {
            startPage = item;
          } 
        }
        conf.set('item_dictionary', item_dictionary);
        // set page routes
        var routes = {};
        var pageRoutes = {};
        routes['/'] = {type: 'page', id: startPage.id, path: '/'};
        pageRoutes['/'] = startPage;
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          if(item.meta.page_type) {
            routes['/' + item.attributes.slug] = {type: 'page', id: item.id, path: item.attributes.route}; 
            pageRoutes['/' + item.attributes.slug] = item; 
          } 
        }
        // set list routes
        var listRoutes = {}; 
        var metaConfig; 
        for (var i = 0; i < meta.length; i++) { 
          var item = meta[i];
          if (item.id === 'config') {
            metaConfig = item; 
            break; 
          }
        }
        if (metaConfig.value.routes) {
          for (var pageRouteKey in pageRoutes) { 
            //console.log(metaConfig.value.routes); 
            var pageRoute = pageRoutes[pageRouteKey];
            if (metaConfig.value.routes[pageRoute.meta.page_type.data.id]) {
              var listRoutes = metaConfig.value.routes[pageRoute.meta.page_type.data.id];
              for (var r in listRoutes) {
                var listRoute = listRoutes[r];
                var listRoutePath = listRoute.path.replace(/:/g, '~');
                //listRoutePath = listRoute.path;
                if (listRoutePath === '/') {
                  listRoutePath = '';
                }
                var addObject = {
                  type: 'collection',
                  item_type: pageRoute.meta.page_type.data.id,
                  path: listRoute.path,
                  full_path: pageRouteKey + listRoute.path,
                  template: listRoute.template,
                };
                //listRoute.type = 'collection';
                //listRoute.item_type = pageRoute.meta.page_type.data.id;
                routes[pageRouteKey + listRoutePath] = addObject;
                listRoutes[pageRouteKey + listRoutePath] = addObject;
              }
            }
          }
        }
        conf.set('start_page', startPage);
        conf.set('routes', routes);
        conf.set('page_routes', pageRoutes);
        next();
      });
    } else {
      next();
    }
  });
  
  // Middleware
  app.use(function(req, res, next) {
    var url = req.url;
    console.log(url);
    var routes = conf.get('routes');
    var item_dictionary = conf.get('item_dictionary');
    var startPage = conf.get('start_page');
    var lastCharOnUrl = url.substring(url.length - 1, url.length);
    if(lastCharOnUrl === '/' && url !== '/') {
      url = url.substring(0, url.length - 1)
    }
    var defaults = {
      url: url,
    };
    var model = {
      start_page: startPage
    };
    swig.setDefaults({locals: defaults});
    //console.log(url);
    //console.log(url.lastIndexOf(url.length - 1, url.length));
    //console.log(url.substring(url.length - 1, url.length));
    //console.log(url.substring(0, url.length - 1));
    if (!~url.indexOf('.')) {
      // It's in seconds. This will be cached for 1 minute.
      //res.header('Cache-Control', 'max-age=60, must-revalidate');
      return res.render('index', model);
    }
    next();
  });
};
































// app.get('/', function (req, res) {
  //   var model = { name: 'Swig templates are here to stay and this is the first page : )', time: process.env.TIMES };
  //   res.render('index', model);
  // });

  // app.get('/:slug', function (req, res) {
  //   var slug = req.params.slug;
  //   var model = { name: 'Swig templates are here to stay and this is an other page with slug ' + slug + ' : )', time: process.env.TIMES };
  //   res.render('index', model);
  // });