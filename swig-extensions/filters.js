var swig = require('swig');
var async = require('async');
var sync = require('sync');
var client = require('../cms-client.js'); 
var cache = require('nconf');   
var querystring = require('querystring');  
var utils = require('./utils');  
 
/**
 * Yields the media url for the requested media item
 * @param {string} id
 */
swig.setFilter('asset_url', function (id) {
  var assetDictionary = cache.get('asset_dictionary');
  if(typeof assetDictionary[id] === 'undefined') {
    return;
  }
  return assetDictionary[id].attributes.file.url;
}); 

/**
 * Yields an API resource
 * @example
 * {{ 'items' | resource('type=blog-post') }}
 * 
 * @param {string} item-types | items | meta | assets
 * @param {string} type=blog-post
 * 
 * @return {object} item-types | items | meta | assets
 */
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

/**
 * Yields the route that corresponds to the url
 * @example
 * {% set current_route = url | route %}
 * 
 * @param {string} url
 * 
 * @return {object} route
 */
swig.setFilter('route', function (url) {
  return utils.getCurrentRoute(url);
});

/**
 * Yields relationships for a property
 * @example
 * item.attributes.image | include

 * @param  {object} property {data: {type: 'items', id: 'slider-1'}}
 * @return {object} item/s or asset/s
 */
swig.setFilter('include', function (property) {
  var relations;
  var item;
  var itemDictionary;
  if(typeof property.data === 'undefined') {
    return;
  }
  if(property.data.type === 'assets') {
    itemDictionary = cache.get('asset_dictionary');
  } else {
    itemDictionary = cache.get('item_dictionary');  
  }
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

/**
 * Get cache
 * @example
 * 'pages' | get_cache

 * @param  {string} key
 * @return {object} 
 */
swig.setFilter('get_cache', function (key) {
  return cache.get('swig-' + key);
});

/**
 * Set cache
 * @example
 * 'pages' | set_cache(obj)

 * @param  {string} key
 * @param  {object} obj
 * @return {object} 
 */
swig.setFilter('set_cache', function (key, obj) {
  cache.set('swig-' + key, obj);
  return '';
});

/**
 * Regular expression match
 * @example
 * 'hello' | match('hello') %}

 * @param  {string} str
 * @param  {string} str
 * @return {string} 
 */
swig.setFilter('match', function (str, regExp) {
  //console.log(regExp)
  return str.match(new RegExp(regExp));
});

/**
 * Split string
 * @example
 * 'hello, herro' | split(',') %}

 * @param  {string} str
 * @param  {string} chars
 * @return {string} 
 */
swig.setFilter('split', function (str, chars) {
  return str.split(chars);
});
