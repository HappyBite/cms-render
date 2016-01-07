var swig = require('swig');
var async = require('async');
var sync = require('sync');
var client = require('../cms-client.js'); 
var cache = require('nconf'); 
var querystring = require('querystring');  
var utils = require('./utils');  

// Get correct route
swig.setFilter('route', function (url) {
  return utils.getCurrentRoute(url);
});

// This filter will return an API resource
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