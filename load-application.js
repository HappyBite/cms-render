var swig = require('swig');
var async = require('async');
var client = require('./cms-client.js'); 
var conf = require('nconf');

module.exports = function(app) {  
  
  var firstLoad = false;

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
        },
        assets: function(callback) {
          client.assets({}, function(err, items) {
            if (err) {
              callback(err);
            } else {
              callback(null, items);
            }
          });
        }
      }, 
      function(err, results) {
        var itemTypes = results.item_types;
        var items = results.items;
        var meta = results.meta;
        var assets = results.assets;
        var item_dictionary = {};
        var asset_dictionary = {};
        var routes = {};
        var pageRoutes = {};
        var pages = [];
        var startPage;
        var startPageId;
        if(typeof items === 'undefined') { 
          console.log('Failed connection to the API');
          res.send('Failed connection to the API');
          return false;
        }
        /**
         * Set item dictionary
         * Set startpage
         */
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          item_dictionary[item.id] = item;
          if(item.attributes.start_page) {
            startPageId = item.relationships.page.data.id;
          } 
        } 
        startPage = item_dictionary[startPageId];
        /**
         * Set asset dictionary
         */
        for (var i = 0; i < assets.length; i++) {
          var asset = assets[i];
          asset_dictionary[asset.id] = asset;
        }
         
        /**
         * Set pages
         * Set page routes
         * Set routes
         */
        routes['/'] = {type: 'page', id: startPage.id, path: '/'};
        pageRoutes['/'] = startPage;
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          if(item.meta.item_type.data.id === 'nav-menu-item') {
            var page = item_dictionary[item.relationships.page.data.id];
            page.attributes.slug = item.attributes.slug;
            page.attributes.path = item.attributes.path;
            page.attributes.display_name = item.attributes.display_name;
            page.attributes.start_page = item.attributes.start_page;
            page.meta.position = item.meta.position;
            routes['/' + page.attributes.slug] = {type: 'page', id: page.id, path: page.attributes.path}; 
            pageRoutes['/' + page.attributes.slug] = page;
            pages.push(page);
          } 
        }
        /**
         * Set cache
         */
        conf.set('item_types', itemTypes);
        conf.set('items', items);
        conf.set('meta', meta);
        conf.set('assets', assets);
        conf.set('item_dictionary', item_dictionary);
        conf.set('asset_dictionary', asset_dictionary);
        conf.set('routes', routes);
        conf.set('page_routes', pageRoutes);
        conf.set('pages', pages);
        conf.set('start_page', startPage);
        firstLoad = true;
        next();
      });
    } else {
      firstLoad = false;
      next();
    }
  }); 
  
  // Middleware
  app.use(function(req, res, next) {
    var url = req.url;
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
      //console.log(url);
      // It's in seconds. This will be cached for 1 minute.
      //res.header('Cache-Control', 'max-age=60, must-revalidate');
      // Att routes to the context on first load
      if (firstLoad) {
        swig.renderFile('template/index.html', model);
      }
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