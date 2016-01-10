var swig = require('swig');
var async = require('async');
var sync = require('sync');
var client = require('../cms-client.js'); 
var cache = require('nconf'); 
var querystring = require('querystring');  
var utils = require('./utils');  

// Returns an API resource
swig.setFilter('asset_url', function (fileName, query) {
  var assetDictionary = cache.get('asset_dictionary');
  console.log(assetDictionary);
  return assetDictionary[fileName];
});

// Returns an API resource
swig.setFilter('resource', function (resource, query) {
  var res;
  if (resource === 'items') { 
    res = cache.get('items');
    if(query) {
      res = utils.filterItems(res, query);
    }
  } else if (resource === 'item-types') {
    res = cache.get('item_types');
  } else if (resource === 'meta') {
    res = cache.get('meta');
    if(query) {
      res = utils.filterMeta(res, query);
    }
  } else if (resource === 'meta_item') {
    res = cache.get('meta');
    if(query) {
      res = utils.filterMetaItem(res, query);
    }
  }
  return res;
});

// Gets the current page
swig.setFilter('current_page', function (url) {
  var routes = cache.get('page_routes');
  return routes[url];
});

// Get current route
swig.setFilter('route', function (url) {
  return utils.getCurrentRoute(url);
});

// Get relationships for a property
swig.setFilter('include', function (property) {
  var relations;
  var item;
  var itemDictionary = cache.get('item_dictionary');
  if (property.data instanceof Array) {
    relations = [];
    if (property.data.length) {
      for (var i = 0; i < property.data.length; i++) {
        item = itemDictionary[property.data[i].id];
        if(item) {
          relations.push(item);  
        }
      }
    }
  } else if (typeof property.data === 'object') {
    relations = {};  
    if (Object.keys(property.data).length) {
      item = itemDictionary[property.data.id];
      relations = item;  
    }
  }
  return relations;
});
