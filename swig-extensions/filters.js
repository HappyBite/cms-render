var swig = require('swig');
var async = require('async');
var sync = require('sync');
var client = require('../cms-client.js');
var cache = require('nconf');
var querystring = require('querystring');

/**
 * Is route 
 * @param {string} url
 */
swig.setFilter('is_list_route', function (url) {
  var listRoutes = cache.get('list_routes');
  return typeof listRoutes[url] !== 'undefined';
});

swig.setFilter('list_route', function (url) {
  var listRoutes = cache.get('list_routes');
  return listRoutes[url];
});

// This filter will return an API resource
swig.setFilter('resource', function (resource, query) {
  var res;
  if (resource === 'items') { 
    res = cache.get('items');
    if(query) {
      res = _filterItems(res, query);
    }
  } else if (resource === 'item-types') {
    res = cache.get('item_types');
  } else if (resource === 'meta') {
    res = cache.get('meta'); 
    if(query) {
      res = _filterMeta(res, query);
    }
  }
  return res;
});

// Gets the current page
swig.setFilter('current_page', function (url) {
  var routes = cache.get('page_routes');
  return routes[url];
});

// Append
swig.setFilter('append', function (str, appendStr) {
  return str + appendStr;
});

// Prepend
swig.setFilter('prepend', function (str, prependStr) {
  return prependStr + str;
});

/**
 * Filter items
 * Ex. query: type[]=page&type[]=blog-post
 * Todo: This should make a request to the API and cache it
 * @param {string, array} data.type Can be string or array
 */
var _filterItems = function(items, query) {
  // Cache this for better performance
  var query = querystring.parse(query);
  var filteredItems = [];
  
  if(query['type[]']) {
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if(~query['type[]'].indexOf(item.meta.item_type.data.id)) {
        filteredItems.push(item);
      }
    }
  }
  return filteredItems;
}

/**
 * Get meta by id
 * Todo: This probably should make a request to the API and cache it
 * @param {string, array} data.type Can be string or array
 */
var _getMetaById = function(id) {
  var metaItem;
  var meta = cache.get('meta');
  for (var i = 0; i < meta.length; i++) {
    var item = meta[i];
    if (item.id === id) {
      metaItem = item;
      break;
    }
  }
  return metaItem.value;
}