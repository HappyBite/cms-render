var express = require('express');
var path = require('path');
var swig = require('swig');
var async = require('async');
var client = require('./cms-client.js');
var helper = require('./lib/helper');
var fs = require('fs');
var cache = require('nconf');
var etag = require('etag');
var AsyncLock = require('node-async-locks').AsyncLock;
var lock = new AsyncLock();

module.exports = function(app) {    
  
  var firstLoad = false;
   
  app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    
    // Set etag
    var cacheKey = 'cached-urls';
    var etagKey = JSON.stringify(req.url);
    var etagDictionary;
    if (cache.get(cacheKey)) {
      etagDictionary = cache.get(cacheKey);
    } else {
      etagDictionary = {}
    }
    if (req.headers['if-none-match'] && req.headers['if-none-match'].toString() === etagDictionary[etagKey]) {
      // console.log('Cached items:' + req.headers['if-none-match']);
      res.status(304).json();
      return;
    }
    res.setHeader('ETag', etag(etagKey));
    etagDictionary[etagKey] = etag(etagKey);
    cache.set(cacheKey, etagDictionary);
    console.log(cacheKey + ': ' + JSON.stringify(etagDictionary));
    

    if (~req.url.indexOf('/render/events/set-env')) {
      var bucketId = req.query.bucket_id;
      var accessToken = req.query.access_token;
      var repoName = '';
      helper.setEnv(bucketId, accessToken, repoName, function(err, response) {
        if(err) {
          var obj = { 
            message: 'Something went wrong!!!',
            req_body: req.body,
            req_query: req.query,
            status: 500,
            error: err
            // data: response
          }
          res.send(obj);
        } else {
          var obj = {
            message: 'Set env was updated successfully!!!',
            req_body: req.body,
            req_query: req.query,
            status: 200
            // data: response
          }
          cache.set('version', Date.now());
          res.send(obj);
          // console.log('Japp');
        }
      });
      return;
    }
    if (~req.url.indexOf('/render/events/clear-cache')) {
      cache.clear('items');
      console.log('Cleared key: ', 'items');    
      cache.clear('cached-urls');
      console.log('Cleared key: ', 'cached-urls');
      var currentCacheObjects = cache.get();
      for (var cacheKey in currentCacheObjects) {
        if (~cacheKey.indexOf('swig-')) {
          cache.clear(cacheKey);
          console.log('Cleared key: ', cacheKey);    
        }
      }
      var obj = {
        message: 'Cache cleared successfully',
        status: 200
      }
      res.send(obj);
      console.log('Cleared cache');
      // Don´t return here. Continue for setting the cache.
    }
    lock.enter(function(token) {
      if (!cache.get('items')) {
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
          media: function(callback) {
            client.media({}, function(err, items) {
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
          var media = results.media;
          var item_dictionary = {};
          var media_dictionary = {};
          var bucket_meta_dictionary = {};
          var routes = {};
          var pageRoutes = {};
          var startPage;
          var startPageId;
          if(typeof items === 'undefined') {
            console.log('Failed connection to the API');
            res.send('Failed connection to the API');
            lock.leave(token);
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
           * Set media dictionary
           */
          for (var i = 0; i < media.length; i++) {
            var mediaItem = media[i];
            media_dictionary[mediaItem.id] = mediaItem;
          }

          /**
           * Set bucket meta dictionary
           */
          for (var i = 0; i < meta.length; i++) {
            var bucketMeta = meta[i];
            bucket_meta_dictionary[bucketMeta.id] = bucketMeta.attributes.value;
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
          cache.set('item_types', itemTypes);
          cache.set('items', items);
          cache.set('meta', meta);
          cache.set('media', media);
          cache.set('item_dictionary', item_dictionary);
          cache.set('media_dictionary', media_dictionary);
          cache.set('bucket_meta_dictionary', bucket_meta_dictionary);
          cache.set('routes', routes);
          cache.set('page_routes', pageRoutes);
          cache.set('version', Date.now());
          firstLoad = true;
          lock.leave(token);
          next();
        });
      } else {
        firstLoad = false;
        lock.leave(token);
        next();
      }
    });
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
    
    var templateDirExist = fs.existsSync('templates/template-prod');
    var devTemplateDirExist = fs.existsSync('templates/template-dev');
    if ((!templateDirExist && req.query.env !== 'dev') || (req.query.env === 'dev' && !devTemplateDirExist)) {
      var repoName = cache.get('bucket_meta_dictionary').template_custom;
      var env = req.query.env === 'dev' ?
                'dev' :
                'prod';
      helper.gitPull(repoName, env, null, function(err, response) {
        if(err) {
          var obj = { 
            message: 'Something went wrong!!!',
            req_body: req.body,
            req_query: req.query,
            status: 500,
            error: err
            // data: response
          }
          res.send(obj);
        } else {
          var obj = {
            message: 'Git pull was updated successfully!!!',
            req_body: req.body,
            req_query: req.query,
            status: 200
            // data: response
          }
          cache.set('version', Date.now());
          if (req.query.env === 'dev') {
            // res.redirect('/?env=dev');
            res.redirect('/');
          } else {
            res.redirect('/');  
          }
        }
      });
    } else if (~url.indexOf('/render/events/git-pull') || ~url.indexOf('/render/events/deploy')) {
      var repoName = cache.get('bucket_meta_dictionary').template_custom;
      var env = req.query.env;
      var tag = req.query.tag;
      helper.gitPull(repoName, env, tag, function(err, response) {
        if(err) {
          var obj = { 
            message: 'Something went wrong!!!',
            req_body: req.body,
            req_query: req.query,
            status: 500,
            error: err
            // data: response
          }
          res.send(obj);
        } else {
          var obj = {
            message: 'Git pull was updated successfully!!!',
            req_body: req.body,
            req_query: req.query,
            status: 200
            // data: response
          }
          cache.set('version', Date.now());
          res.send(obj);
        }
      });
    } else if (!~url.indexOf('.')) {
      // app.use('/assets', express.static( path.join( __dirname, 'templates/template-dev' ), { maxAge: 86400000 }));
      var templateIndex;
      if (req.query.env === 'dev') {
        templateIndex = 'templates/template-dev/index.html';
      } else {
        templateIndex = 'templates/template-prod/index.html';
      }
      var defaults = {
        url: url,
        query: query,
        version: cache.get('version'),
        template_index: templateIndex,
        render_version: '0.1.0',
        cms_edit: req.query.env === 'dev'
      };
      var model = {};
      swig.setDefaults({locals: defaults});

      // Add routes to the context on first load
      if (firstLoad) {
        swig.renderFile(templateIndex, model);
      }
      res.render('../index', model);
    } else {
      next();
    }
  });
};