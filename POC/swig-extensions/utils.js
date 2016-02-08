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
  filterMeta: function(query) {
    // Cache this for better performance
    var meta = cache.get('meta');
    var query = query ? querystring.parse(query) : null;
    if (!query) {
      return items;
    }
    var filteredItems = [];
    if(query.id) {
      for (var i = 0; i < meta.length; i++) {
        var metaItem = meta[i];
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
  getCurrentRoute: function(url, customRoute) {
    var routes = cache.get('routes');
    var currentRoute = routes[url];
    var route_ids = {};
    
    if (customRoute) {
      var pageRoutes = cache.get('page_routes');
      for (var pageRouteKey in pageRoutes) {
        var listRoutePath = customRoute.path.replace(/:/g, '~');
        listRoutePath = listRoutePath !== '/' ? listRoutePath : '';
        var pageRoute = pageRoutes[pageRouteKey];
        if (pageRoute.item_type === customRoute.item_type) {
          var addObject = {
            type: 'collection',
            item_type: pageRoute.item_type,
            //path: customRoute.path,
            path: pageRouteKey + (customRoute.path !== '/' ? customRoute.path : ''),
            page_path: pageRoute.path
            //template: 'none'
          };
          routes[pageRouteKey + listRoutePath] = addObject;
          //console.log(routes[pageRouteKey + listRoutePath]);
        }
      }
      cache.set('routes', routes);
    }

    //if (!currentRoute || customRoute) {
      // console.log('');
      // console.log('---------------------------------------------------');  
      // console.log('Requested url: ' + url);
      // console.log('---------------------------------------------------');  
      var patt = /(\~)(\w+)/g;
      for (var routeKey in routes) {
        var route = routes[routeKey];
        // console.log(routeKey);
        // console.log(route);
        if (route.path) {
          //var routeMatcher = new RegExp(route.path.replace(/:[^\s/]+/g, '([\\w-]+)'));
          var routeMatcher = route.path.replace(/:[^\s/]+/g, '([\\w-]+)');
          var matcher = url.match(routeMatcher);
          if(matcher) { 
            res = matcher[0];
            if(res === url) { 
              // console.log('Test: ' + routeMatcher.test(url));
              // console.log('Found match: ' + res);
              // console.log(route.path);
              if (route.path) {
                var routePathSplit = route.path.split('/:');
                for (var i = 0; i < matcher.length; i++) {
                  if (i > 0) {  
                    //console.log(routePathSplit[i] + ': ' + matcher[i]);
                    //route[routePathSplit[i]] = matcher[i];
                    route_ids[routePathSplit[i]] = matcher[i];
                  }
                }
              }
              currentRoute = route; 
            }
          }
        }
      }
    //}
    if (currentRoute) {
      currentRoute.ids = route_ids;
      //currentRoute.url = currentRoute.path;
      if(Object.keys(currentRoute.ids).length) {
        for (var key in currentRoute.ids) {
          var id = currentRoute.ids[key];
          //currentRoute.url = currentRoute.url.replace(':' + key, id);
        }
      }
      // var pageRoutes = cache.get('page_routes');
      // pageRoutes[currentRoute.url] = page;
      // cache.set('page_routes', pageRoutes);
    }
    // } else {
    //   currentRoute = {
    //     type: '',
    //     item_type: '',
    //     path: '',
    //     path: '',
    //     template: '',
    //     ids: null
    //   }
    // }
    //console.log(currentRoute.ids);
    return currentRoute;
  }
};