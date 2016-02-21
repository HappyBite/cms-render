var swig = require('swig');
var async = require('async');
var client = require('./cms-client.js');
var helper = require('./lib/helper');
var conf = require('nconf');
var fs = require('fs');
  
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
        var store_meta_dictionary = {};
        var routes = {};
        var pageRoutes = {};
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
         * Set store meta dictionary
         */
        for (var i = 0; i < meta.length; i++) {
          var storeMeta = meta[i];
          store_meta_dictionary[storeMeta.id] = storeMeta.attributes.value;
        }
         
        /**
         * Set routes
         */
        routes['/'] = {type: 'page', item_type: startPage.meta.item_type.data.id, path: '/'};
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
            routes['/' + page.attributes.slug] = {type: 'page', item_type: page.meta.item_type.data.id, path: page.attributes.path}; 
            pageRoutes['/' + page.attributes.slug] = {type: 'page', item_type: page.meta.item_type.data.id, path: page.attributes.path}; 
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
        conf.set('store_meta_dictionary', store_meta_dictionary);
        conf.set('routes', routes);
        conf.set('page_routes', pageRoutes);
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
    var query = req.query;
    url = ~url.indexOf('?') ? url.split('?')[0] : url;
    var lastCharOnUrl = url.substring(url.length - 1, url.length);
    if(lastCharOnUrl === '/' && url !== '/') {
      url = url.substring(0, url.length - 1);
    }
    var defaults = {
      url: url,
      query: query
    };
    var model = {};
    swig.setDefaults({locals: defaults});
    var templateDirExist = fs.existsSync('template');
    if (~url.indexOf('/github/events') || !templateDirExist) {
      var template = 'cloudpen-template-' + conf.get('store_meta_dictionary').template;
      var templateCustom = conf.get('store_meta_dictionary').template_custom;
      if (templateDirExist) {
        conf.clear('items');
      }
      var repoName;
      if (req.body && req.body.payload) {
        var payload = JSON.parse(req.body.payload);
        repoName = payload.repository.name;
      } else if (!templateDirExist) {
        repoName = template;
      } else {
        repoName = templateCustom;
      }
      helper.installTemplate(repoName, templateDirExist, function(err, files) {
        if(err) {
          res.send(err);
        } else {
          var obj = {
            message: 'Github webhook was executed successfully!!!',
            req_params: req.params,
            req_body: req.body,
            req_query: req.query,
            req_payload: req.payload,
            template: template,
            template_custom: templateCustom
            //content: files
          }
          if (!templateDirExist) {
            res.redirect('/');
          } else {
            res.send(obj);   
          }
        }
      });
    } else if (!~url.indexOf('.')) {
      // It's in seconds. This will be cached for 1 minute.
      //res.header('Cache-Control', 'max-age=60, must-revalidate');
      
      // Add routes to the context on first load
      if (firstLoad) {
        swig.renderFile('template/index.html', model);
      }
      res.render('index', model);
    } else {
      next();
    }
  });
};