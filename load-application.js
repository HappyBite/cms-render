var async = require('async');
var client = require('./cms-client.js');
var conf = require('nconf');
 
module.exports = function(app) {
  app.use(function(req, res, next) {
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
        // get start page
        var startPage;
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          if(item.attributes.start_page) {
            startPage = item;
            break;
          } 
        }
        // set page routes
        var routes = {};
        var pageRoutes = {};
        routes['/'] = {type: 'page', id: item.id};
        pageRoutes['/'] = startPage;
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          if(item.meta.page_type) {
            routes['/' + item.attributes.slug] = {type: 'page', id: item.id}; 
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
                var listRoutePath = listRoute.path ? listRoute.path.replace(':', '') : listRoute.replace(':', '');
                if (listRoutePath === '/') {
                  listRoutePath = '';
                }
                if (listRoute.path) {
                  listRoute['type'] = 'collection';
                  listRoute['item_type'] = pageRoute.meta.page_type.data.id;
                } else {
                  listRoute = {
                    type: 'collection',
                    item_type: pageRoute.meta.page_type.data.id,
                    path: listRoute
                  }
                }
                routes[pageRouteKey + listRoutePath] = listRoute;
                listRoutes[pageRouteKey + listRoutePath] = listRoute;
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
    var routes = conf.get('routes');
    var startPage = conf.get('start_page');
    var model = {
      relative_url: url,
      routes: routes,
      start_page: startPage
    };
    if (!~url.indexOf('.') && routes[url]) {
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