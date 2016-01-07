var async = require('async');
var sync = require('sync');
var client = require('../cms-client.js'); 
var cache = require('nconf'); 
var querystring = require('querystring'); 

module.exports = {
  
  /**
   * Filter items
   * Ex. query: type[]=page&type[]=blog-post
   * Todo: This should make a request to the API and cache it
   * @param {array} items
   * @param {array} query
   */
  filterItems: function(items, query) {
    // Cache this for better performance
    var query = querystring.parse(query);
    var filteredItems = [];
    if(query['type[]'] || query['type']) {
      query['type[]'] = typeof query['type[]'] === 'string' ? [query['type[]']] : query['type[]'];
      query['type'] = typeof query['type'] === 'string' ? [query['type']] : query['type'];
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if(query['type[]']) {
          if(~query['type[]'].indexOf(item.meta.item_type.data.id)) {
            filteredItems.push(item);
          }
        } else {
          if(~query['type'].indexOf(item.meta.item_type.data.id)) {
            filteredItems.push(item);
          }  
        }
      }
    }
    return filteredItems;
  },

  /**
   * Filter meta
   * Ex. query: type[]=page&type[]=blog-post
   * Todo: This should make a request to the API and cache it
   * @param {array} items
   * @param {array} query
   */
  filterMeta: function(metaItems, query) {
    // Cache this for better performance
    var query = querystring.parse(query);
    var filteredItems = [];
    if(query.id) {
      for (var i = 0; i < metaItems.length; i++) {
        var metaItem = metaItems[i];
        if(metaItem.id === query.id) {
          filteredItems.push(metaItem);
          break;
        }
      }
    }
    return filteredItems;
  },

  /**
   * Filter meta item. Get meta by id.
   * Ex. query: type[]=page&type[]=blog-post
   * Todo: This should make a request to the API and cache it
   * @param {array} items
   * @param {string} id
   */
  filterMetaItem: function(metaItems, id) {
    // Cache this for better performance
    var item;
    for (var i = 0; i < metaItems.length; i++) {
      var metaItem = metaItems[i];
      if(metaItem.id === id) {
        item = metaItem;
        break;
      }
    }
    return item;
  },

  /**
    * Yields the current route
    * @example
    * getCurrentRoute('/blogg/archive/2007/11/07/');
    
    * @param {string} url
    * @return {object} route
    * @private
    */
  getCurrentRoute: function(url) {
    var routes = cache.get('routes');
    var currentRoute = routes[url];
    var route_ids = {};
    if (!currentRoute) {
      // console.log('');  
      // console.log('---------------------------------------------------');  
      // console.log('Requested url: ' + url);
      // console.log('---------------------------------------------------');  
      var patt = /(\~)(\w+)/g;
      for (var routeKey in routes) {
        var route = routes[routeKey];
        var routeMatcher = new RegExp(routeKey.replace(/~[^\s/]+/g, '([\\w-]+)'));
        var matcher = url.match(routeMatcher);
        if(matcher) {
          res = matcher[0];
          if(res === url) {
            // console.log('Test: ' + routeMatcher.test(url));
            // console.log('Found match: ' + res);
            // console.log(route.full_path);
            var routePathSplit = route.full_path.split('/:');
            for (var i = 0; i < matcher.length; i++) {
              if (i > 0) {
                //console.log(routePathSplit[i] + ': ' + matcher[i]);
                route[routePathSplit[i]] = matcher[i];
                route_ids[routePathSplit[i]] = matcher[i];
              }
            }
            currentRoute = route;
          }
        }
      }
    }
    currentRoute.ids = route_ids;
    return currentRoute;
  }
};