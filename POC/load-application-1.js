var express = require('express');
var path = require('path');
var swig = require('swig');
var async = require('async');
var client = require('./cms-client.js');
var helper = require('./lib/helper');
var conf = require('nconf');
var fs = require('fs');

module.exports = function(app) {    
  
  var firstLoad = false;
   
  app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    
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
          conf.set('version', Date.now());
          res.send(obj);
          // console.log('Japp');
        }
      });
      return;
    }
    if (req.body.action === 'set_env' || req.url === '/config') {
      var config = conf.get('config');
      var bucketId = config && config.env && config.env.bucket_id ?
                     config.env.bucket_id :
                     req.body.bucket_id;
      var accessToken = config && config.env && config.env.access_token ?
                        config.env.access_token :
                        req.body.access_token;
      var repoName = config && config.env && config.env.repo_name ?
                 config.env.repo_name :
                 req.body.repo_name;
      var repoPath = config && config.env && config.env.repo_path ?
                 config.env.repo_path :
                 req.body.repo_path;
      var localRepoName = config && config.env && config.env.local_repo_name ?
                     config.env.local_repo_name :
                     req.body.local_repo_name;
      var model = {
        bucket_id: bucketId,
        access_token: accessToken,
        repo_name: repoName,
        repo_path: repoPath,
        local_repo_name: localRepoName 
      };
      if (req.body.bucket_id && req.body.bucket_id.length && req.body.access_token && req.body.access_token.length && req.body.repo_name && req.body.repo_name.length && req.body.repo_path && req.body.repo_path.length) {
        helper.setConfig(req.body.bucket_id, req.body.access_token, req.body.repo_name, req.body.repo_path, req.body.local_repo_name, function(err, response) {
          model['success'] = true;
          // res.render('../start-coding/index', model);
          conf.clear('items');
          res.redirect('/');
        });
      } else {
        if (req.body.action === 'set_env') {
          model['success'] = false;
        }
        res.render('../start-coding/index', model);
      }
      return;
    }
    var templateDirExist = fs.existsSync('templates/template-prod');
    // if (!templateDirExist) {
    //   if (!process.env.NODE_ENV && !(conf.get('config') && conf.get('config').env && conf.get('config').env.repo_name)) {
    //     res.redirect('/config');
    //     // var model = {};
    //     // res.render('../start-coding/index', model);  
    //     return;
    //   }
    // }
    if (~req.url.indexOf('/render/events/clear-cache')) {
      conf.clear('items');
      var currentCacheObjects = conf.get();
      for (var cacheKey in currentCacheObjects) {
        if (~cacheKey.indexOf('swig-')) {
          conf.clear(cacheKey);
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
        conf.set('item_types', itemTypes);
        conf.set('items', items);
        conf.set('meta', meta);
        conf.set('media', media);
        conf.set('item_dictionary', item_dictionary);
        conf.set('media_dictionary', media_dictionary);
        conf.set('bucket_meta_dictionary', bucket_meta_dictionary);
        conf.set('routes', routes);
        conf.set('page_routes', pageRoutes);
        conf.set('version', Date.now());
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
    // var cmsEdit = "";
    // cmsEdit += "<script type='text/javascript'>";
    // // cmsEdit += "alert('gaga');";
    // // cmsEdit += "if (~location.href.indexOf('cms_edit=true')) {";
    // // cmsEdit += "sessionStorage.cms_edit = true";
    // // cmsEdit += "}";
    // // cmsEdit += "window.top.window.postMessage({'action': 'set_template_current_url', 'value': location.href}, '*');";
    // cmsEdit += "parent.frames['code'] && parent.frames['code'].postMessage({'action': 'set_template_current_url', 'value': location.href}, '*');";
    // cmsEdit += "</script>";
    if (req.query.cms_edit === 'true') {
      req.session.cms_edit = true;
    }
    
    var templateIndex = 'templates/template-prod/index.html';
    var templateDirExist = fs.existsSync('templates/template-prod');
    var config = conf.get('config');
    // if (config) {
    //   var repo = config.env.local_repo_name.length ? config.env.local_repo_name : config.env.repo_name;
    //   templateDirExist = fs.existsSync(config.env.repo_path + '/' + repo);
    //   templateIndex = config.env.repo_path + '/' + repo + '/index.html';
    //   app.use('/assets', express.static( path.join(config.env.repo_path, repo + '/assets' ), { maxAge: 86400000 }));
    // }
    var defaults = {
      url: url,
      query: query,
      version: conf.get('version'),
      template_index: templateIndex,
      render_version: '0.1.0',
      cms_edit: req.session.cms_edit === true
    };
    var model = {};
    swig.setDefaults({locals: defaults});
    
    if (!templateDirExist) {
      // var config = conf.get('config');
      // var repoName = config && config.env && config.env.repo_name ?
      //                config.env.repo_name :
      //                conf.get('bucket_meta_dictionary').template_custom;
      var repoName = conf.get('bucket_meta_dictionary').template_custom;
      console.log(repoName);
      helper.gitPull(repoName, 'prod', function(err, response) {
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
          conf.set('version', Date.now());
          // res.send(obj);
          res.redirect('/');
        }
      });
    } else if (~url.indexOf('/render/events/git-pull')) {
      var repoName = conf.get('bucket_meta_dictionary').template_custom;
      var env = req.query.env;
      helper.gitPull(repoName, env, function(err, response) {
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
          conf.set('version', Date.now());
          res.send(obj);
        }
      });
    } else if (~url.indexOf('/render/events/update-file')) {
      helper.updateFile(req.body.file_path, req.body.content, function(err, response) {
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
            message: 'File was updated successfully!!!',
            req_body: req.body,
            req_query: req.query,
            status: 200
            // data: response
          }
          conf.set('version', Date.now());
          res.send(obj);
        }
      });
    } else if (~url.indexOf('/render/events/delete-file')) {
      helper.deleteFile(req.body.file_path, function(err, response) {
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
            message: 'File was deleted successfully!!!',
            req_body: req.body,
            req_query: req.query,
            status: 200
            // data: response
          }
          res.send(obj);
        }
      });
    } else if (~url.indexOf('/github/events')) {
      var template = 'cloudpen-template-' + conf.get('bucket_meta_dictionary').template;
      var templateCustom = conf.get('bucket_meta_dictionary').template_custom;
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
            template_custom: templateCustom,
            content: files
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
        swig.renderFile(templateIndex, model);
      }
      res.render('../index', model);
    } else {
      next();
    }
  });
};