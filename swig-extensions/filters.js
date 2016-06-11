var swig = require('swig');
var cache = require('nconf');
var utils = require('./utils');

/**
 * Yields an API resource
 * @example
 * {{ 'items' | resource('type=blog-post') }}
 * 
 * @param {string} item-types | items | meta | media
 * @param {string} type=blog-post
 * 
 * @return {object} item-types | items | meta | media
 */
swig.setFilter('resource', function (resource, query) {
  var res;
  if (resource === 'items') {
    res = utils.filterItems(query);
  } else if (resource === 'meta') {
    res = utils.filterMeta(query);
  } else {
    query = query ?
            query + '&type=' + resource :
            'type=' + resource;
    res = utils.filterItems(query);
  }
  return res;
});

/**
 * Yields relationships for a property
 * @example
 * item.attributes.image | include

 * @param  {object} property {data: {type: 'items', id: 'slider-1'}}
 * @return {object} item/s or media/s
 */
swig.setFilter('include', function (property) {
  var relations;
  var item;
  var itemDictionary;
  if(!property.data) {
    return;
  }
  if(property.data.type === 'media') {
    itemDictionary = cache.get('media_dictionary');
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
 * Yields the asset url for the requested file in assets directory
 * @param {string} path
 */
swig.setFilter('asset_url', function (path, query) {
  return '/assets/' + path + '?version=' + cache.get('version');
});

/**
 * Yields the media url for the requested media item
 * @param {string} id
 */
swig.setFilter('media_item_url', function (id) {
  var mediaDictionary = cache.get('media_dictionary');
  if(typeof mediaDictionary[id] === 'undefined') {
    return;
  }
  return mediaDictionary[id].attributes.file.url;
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