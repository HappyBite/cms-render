var async = require('async');
var sync = require('sync');
var client = require('../cms-client.js'); 
var cache = require('nconf');
var querystring = require('querystring'); 

module.exports = {
  
  /**
   * Filter items
   * Ex. query: type=blog-post&attributes.slug[eq]='bloggpost-1'
   * Todo: This should make a request to the API and cache it
   * @param {object} query
   * @return {array} items
   */
  filterItems: function(query) {
    var items = cache.get('items');
    if (!query) { return items; }
    var query = querystring.parse(query);
    var filteredItems = [];
    var hasFilter = false;

    for (var q in query) {
      if(~q.indexOf('[eq]') || ~q.indexOf('[in]')) {
        hasFilter = true;
        break;
      }
    }
    if(query['type']) {
      query['type'] = typeof query['type'] === 'string' ? [query['type']] : query['type'];
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if(~query['type'].indexOf(item.meta.item_type.data.id)) {
          if (this._isItemIncluded(item, query, hasFilter)) {
            filteredItems.push(item);
          }
        }  
      }
    } else {
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (this._isItemIncluded(item, query, hasFilter)) {
          filteredItems.push(item); 
        }
      }
    }

    if(query['sort']) {
      filteredItems = this._sortItems(filteredItems, query['sort'])
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
  },

  /**
   * Is item included
   * @param {object} item
   * @param {object} query
   * @return {bool}
   */
  _isItemIncluded: function(item, query, hasFilter) {
    var isItemIncluded = false;
    if (hasFilter) {
      for (var q in query) {
        var qValue = query[q];
        if(~q.indexOf('[eq]')) {
          var qSplit = q.replace('[eq]', '').split('.');
          if(item[qSplit[0]][qSplit[1]] === qValue) {
            isItemIncluded = true;
          }  
        }
      }
    } else {
      isItemIncluded = true;
    }
    return isItemIncluded;
  },

  /**
   * Sort items
   * @param {object} items
   * @param {object} query
   * @return {array} items
   */
  _sortItems: function(items, sortQuery) {
    var sortDesc = false;
    if (sortQuery.substring(0, 1) === '-') {
      sortDesc = true;
      sortQuery = sortQuery.substring(1, sortQuery.length);
    }
    items = items.sort(function(a, b) {
      var val1 = a[sortQuery];
      var val2 = b[sortQuery];
      if (~sortQuery.indexOf('.')) {
        var sortQuerySplit = sortQuery.split('.');
        val1 = a[sortQuerySplit[0]][sortQuerySplit[1]];
        val2 = b[sortQuerySplit[0]][sortQuerySplit[1]];
      }
      val1 = typeof val1 !== 'undefined' ? val1 : '';
      val2 = typeof val2 !== 'undefined' ? val2 : '';
      var isDate = Date.parse(val1.toString().replace(/ /g, ''));
      var isInt = !isNaN(val1);
      if (sortDesc) {
        if (isInt) {
          return parseInt(val1)-parseInt(val2);
        } else if (isDate) {
          return new Date(val2)-new Date(val1);  
        } else {
          return val2.localeCompare(val1);
        }
      } else {
        if (isInt) {
          return parseInt(val2)-parseInt(val1);
        } else if (isDate) {
          return new Date(val1)-new Date(val2);
        } else {
          return val1.localeCompare(val2);
          //return val1-val2;
        }
      }
    });
    return items;  
  }
};