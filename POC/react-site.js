// url = typeof location !== 'undefined' ?
  //       location.pathname :
  //       url;

const credentials = <script dangerouslySetInnerHTML={{ __html: `window.bucket_id = '${process.env.BUCKET_ID}';window.access_token = '${process.env.ACCESS_TOKEN}';` }} />;

<script dangerouslySetInnerHTML={{ __html: `window.bucket_id = '${process.env.BUCKET_ID}';window.access_token = '${process.env.ACCESS_TOKEN}';` }} />

var twixly = require('./twixly-client');
var async = require('async');
var cache = require('./cache');

module.exports = function setData(cb) {
  if (typeof window === 'undefined') {
    console.log('This will only show once!');
    async.parallel({
      item_types: function(callback) {
        twixly.itemTypes({}, function(err, itemTypes) {
          if (err) { 
            callback(err);
          } else {
            callback(null, itemTypes); 
          }
        });
      },
      items: function(callback) {
        twixly.items({}, function(err, items) {
          if (err) { 
            callback(err);
          } else {
            callback(null, items);
          }
        }); 
      },
      meta: function(callback) {
        twixly.meta({}, function(err, items) {
          if (err) {
            callback(err);
          } else {
            callback(null, items);
          }
        });
      },
      media: function(callback) {
        twixly.media({}, function(err, items) {
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
      var pages = {};
      var startPage;
      var startPageId;
      if(typeof items === 'undefined') {
        cb('no_items');
        return;
      }
      
      /**
       * Set item dictionary
       * Set startpage
       */
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        item_dictionary[item.id] = item;
        if(item.attributes && item.attributes.start_page) {
          startPageId = item.relationships.page.data.id;
        }
      } 
      if (startPageId) {
        startPage = item_dictionary[startPageId];
      }
      
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
      if (startPage) {
        routes['/'] = {type: 'page', item_type: startPage.meta.item_type.data.id, path: '/'};
        pageRoutes['/'] = startPage;
        pages['/'] = startPage;
      }
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
          if (page.id !== startPage.id) {
            pages['/' + page.attributes.slug] = page;
          }
        } 
      }
      
      var data = {
        itemTypes,
        items,
        meta,
        media,
        item_dictionary,
        media_dictionary,
        bucket_meta_dictionary,
        routes,
        pageRoutes,
        pages,
        version: Date.now()
      }
      cache.set('data', data);
      cb(null, data);
    });
  } else {
    var request = require('superagent');
    async.parallel({
      data: function(callback) {
        request
          .get('/_data')
          .set('Accept', 'application/json')
          .end(function(err, res){
            if (err) {
              callback(null, res); 
            } else {
              callback(null, res);   
            }
          });
      }
    }, 
    function(err, results) { 
      if (err) {
        cb('no_data');
        return;
      }
      var data = results.data.body;
      cache.set('data', data);
      cb(null, data);
    });
  }
};



// preserve newlines, etc - use valid JSON
// var fixedData = window.data;
// fixedData = fixedData.replace(/\\n/g, "\\n")  
// .replace(/\\'/g, "\\'")
// .replace(/\\"/g, '\\"')
// .replace(/\\&/g, "\\&")
// .replace(/\\r/g, "\\r")
// .replace(/\\t/g, "\\t")
// .replace(/\\b/g, "\\b")
// .replace(/\\f/g, "\\f");
// remove non-printable and other non-valid JSON chars
// fixedData = fixedData.replace(/[\u0000-\u0019]+/g, '');
// fixedData = JSON.parse(fixedData);
// console.log('data: ', JSON.parse(fixedData));
// var data = fixedData;
// var data = helper.getData(req.url);