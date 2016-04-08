var async = require('async');
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
      if(~q.indexOf('[eq]') || ~q.indexOf('[ne]') || ~q.indexOf('[in]') || ~q.indexOf('[nin]') || ~q.indexOf('[elemMatch]')) {
        hasFilter = true;
        break;
      }
    }
    if(query['type']) {
      query['type'] = query['type'].split(',');
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
   * Is item included
   * @param {object} item
   * @param {object} query
   * @return {bool}
   */
  _isItemIncluded: function(item, queries, hasFilter) {
    var isItemIncluded = false;
    var getPropertyValue = function(qKey) {
      var propertyValue;
      var qSplit;
      if (~qKey.indexOf('[eq]')) {
        qSplit = qKey.replace('[eq]', '').split('.');
      } else if (~qKey.indexOf('[in]')) {
        qSplit = qKey.replace('[in]', '').split('.');
      } else if (~qKey.indexOf('[elemMatch]')) {
        qSplit = qKey.replace('[elemMatch]', '').split('.');
      }
      if (qSplit) {
        for (var i = 0; i < qSplit.length; i++) {
          propertyValue = propertyValue ? propertyValue : item;
          if (propertyValue[qSplit[i]]) {
            propertyValue = propertyValue[qSplit[i]];  
          } else {
            propertyValue = null;
            break;
          }
        }
      }
      return propertyValue;
    };
    var elemMatch = function(qKey, qValue) {
      var containsKey;
      qValue = eval('(' + qValue.replace(/\[/g,'{').replace(/\]/g,'}').replace(/\=/g,':') + ')');
      var propertyValue = getPropertyValue(qKey);
      if(!propertyValue || propertyValue.length === 0) {
        if (qValue[Object.keys(qValue)[0]].hasOwnProperty('exists') && !qValue[Object.keys(q)[0]].exists) {
          return true;
        } else {
          return false;
        }
      }
      containsKey = propertyValue.some( (o) => {
        if (qValue[Object.keys(qValue)[0]].hasOwnProperty('exists')) {
          if (qValue[Object.keys(qValue)[0]].exists) {
            if (o[Object.keys(qValue)[0]]) {
              return o;
            }
          } else {
            if (typeof o[Object.keys(qValue)[0]] === 'undefined') {
              return o;
            }
          }
        } else {
          if (o[Object.keys(qValue)[0]] === qValue[Object.keys(qValue)[0]]) {
            return o;
          }  
        }
      });
      return containsKey;
      // var containsKey = arr.some( (o) => 
      //     o[Object.keys(q)[0]] === q[Object.keys(q)[0]]);
      // return containsKey;
      
      //return arr.filter((o) => (o[Object.keys(q)[0]] === q[Object.keys(q)[0]])).length > 0;
      // var containsKey = arr.some( (o) => {
      //   var valueSplit = q[Object.keys(q)[0]].split(',');
      //   return ~valueSplit.indexOf(o[Object.keys(q)[0]]);
      // });
    };
    var isIncluded = function(qKey, qValue, operator) {
      var _isIncluded = false;
      var propertyValue = getPropertyValue(qKey);
      qSplit = qValue.split(',');
      if (operator === 'eq' || operator === 'in') {
        if(typeof propertyValue === 'string') {
          _isIncluded = (~qSplit.indexOf(propertyValue));
        } else if (propertyValue instanceof 'array') {
          _isIncluded = propertyValue.some( (v) => 
            ~qSplit.indexOf(v)
          );
        }
      } else if (operator === 'ne' || operator === 'nin') {
        if(typeof propertyValue === 'string') {
          _isIncluded = (!~qSplit.indexOf(propertyValue));
        } else if (propertyValue instanceof 'array') {
          _isIncluded = propertyValue.some( (v) => 
            !~qSplit.indexOf(v)
          );
        }
      }
      return _isIncluded;
    };
    if (hasFilter) {
      for (var qKey in queries) {
        var qValue = queries[qKey];
        //console.log(qKey + ': ' + qValue);
        //console.log(queries);
        if(~qKey.indexOf('[eq]')) {
          if(isIncluded(qKey, qValue, 'eq')) {
            isItemIncluded = true;
          }
        }
        if(~qKey.indexOf('[in]')) {
          if(isIncluded(qKey, qValue, 'in')) {
            isItemIncluded = true;
          }
        }
        if(~qKey.indexOf('[ne]')) {
          if(isIncluded(qKey, qValue, 'ne')) {
            isItemIncluded = true;
          }
        }
        // if(~qKey.indexOf('[elemMatch]')) {
        //   if(elemMatch(qKey, qValue)) {
        //     isItemIncluded = true;
        //   }
        // }
      }
      //console.log('----------------------------------------------');
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























