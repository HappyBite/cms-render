var merge = require('merge');
var request = require('superagent');
var axios = require('axios');
var querystring = require('qs');
var cache;

if (typeof window !== 'undefined') {
  cache = {
    get: function(key) {
      return localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key)) : null;
    },
    set: function(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }
} else {
  cache = require('nconf');
  // Init cache
  cache.argv().env();
  cache.add('system', {type: 'file', file: 'dummy: has to be here to get set to work'});
}

/**
 * Client
 * Create a new instance of client and add the correct options
 * @param {object} options
 */
var Client = function(options) {
  this.defaults = {
    http: 'https',
    version: 'v1',
    store: null,
    secure : true,
    host : 'api-cms-1.herokuapp.com',
    port : null,
    accessToken : null,
    clientId: null,
    clientSecret: null,
    code: null,
    username : null,
    password : null
  };
  this.options = merge.recursive(this.defaults, options);
  this.options.accessToken = 
    !this.options.accessToken && cache.get('access_token') ?
    cache.get('access_token') :
    this.options.accessToken;
  this.options.store = !this.options.store && cache.get('store_id') ?
    cache.get('store_id') :
    this.options.store
  this.options.http = !this.options.secure ? 'http' : this.options.http; 
  this.options.uri = this.options.http + '://' + this.options.host + (this.options.port ? ':' + this.options.port : '');
  this.options.bearer = 'Bearer ' + this.options.accessToken;
};

/**
 * Get resource
 * @param  {string}   endPoint  [items, item_type, assets]
 * @param  {object}   query    
 * @param  {Function} callback 
 * @return {object}            
 */
Client.prototype.request = function(path, query, callback) {
  var endpoint = this.options.uri + '/'+ this.options.version + '/stores/'+ this.options.store + path;
  request
    .get(endpoint)
    .query(query)
    .set('Accept', 'application/json')
    .set('Authorization', 'Bearer ' + this.options.accessToken)
    .end(function(err, res) {
      if(err)  {
        callback(err);
      } else {
        callback(null, res.body.data);
      }
    });
}

/**
 * Get items
 * @param  {object}   query    
 * @param  {Function} callback 
 * @return {object}            
 */
Client.prototype.items = function(query, callback) {
  this.request('/items', query, callback);
};

/**
 * Get item types
 * @param  {object}   query    
 * @param  {Function} callback 
 * @return {object}            
 */
Client.prototype.itemTypes = function(query, callback) {
  this.request('/item-types', query, callback);
};

/**
 * Get meta
 * @param  {object}   query    
 * @param  {Function} callback 
 * @return {object}            
 */
Client.prototype.meta = function(query, callback) {
  this.request('/meta', query, callback);
};

/**
 * Get assets
 * @param  {object}   query    
 * @param  {Function} callback 
 * @return {object}         
 */
Client.prototype.assets = function(query, callback) {
  this.request('/assets', query, callback);
};

/**
 * Get item
 * @param  {object}   query    
 * @param  {Function} callback 
 * @return {object}            
 */
Client.prototype.getItem = function(id, query, callback) {
  this.request('/items/' + id, query, callback);
};

/**
 * Management
*/
Client.prototype.requestManager = function(path, options, callback) {
  var fromRoot = false;
  path = 
    typeof path !== 'undefined' ?
      path.substring(0, 1) !== '/' ?
      '/' + path :
      path :
    '';
  var storeEndPoints = ['/items', '/item-types', '/assets', '/meta'];
  var storeEndPoint = '/' + path.split('/')[1];
  if (!~storeEndPoints.indexOf(storeEndPoint)) {
    fromRoot = true;
  }
  // console.log(storeEndPoint + ':' + path + ' => From root:' + fromRoot);
  options =
    options ?
    options :
    {};
  var uri;
  var qs =
    options.query ?
    '?' + querystring.stringify(options.query) :
    '';
  if (fromRoot) {
    uri = [
      this.options.uri,
      '/',
      this.options.version,
      path,
      qs
    ].join('');
  } else {
    uri = [
      this.options.uri,
      '/',
      this.options.version,
      '/stores/',
      this.options.store,
      path,
      qs
    ].join('');
  }
  options.url = uri;
  options.data = 
    options.data ?
    options.data :
    {};
  options.method = 
    options.method ?
    options.method :
    'get';
  options.headers = 
    options.headers ?
    options.headers :
    {};
  options.headers['Content-Type'] = 'application/json;charset=utf-8';
  if (this.options.username && this.options.password) {
    options.headers['Authorization'] = 'Basic ' + new Buffer(this.options.username + ':' + this.options.password).toString('base64');
  } else if(!options.headers['Authorization']) {
    options.headers['Authorization'] = 'Bearer ' + this.options.accessToken;
  }
  var response = 
      axios(options)
      .then(function(response) {
        // if (!response.data) {
        //   if (callback) {
        //     callback(null, null);
        //   }
        //   return;
        // }
        // Fix this. There should always be a data object.
        if (callback) {
          if (response.data.data) {
            callback(null, response.data.data);
          } else {
            callback(null, response.data);
          }
        }
        if (response.data.data) {
          return response.data.data;
        } else {
          return response.data;
        }
      })
      .catch(function(error) {
        if (callback) {
          callback(error.data);
        }
        return error.data;
      });
  return response;
}

/**
 * Init
 * @return {object} Access token object
 */
Client.prototype.init = function(callback) {
  if (!this.options.code || cache.get('code') === this.options.code) {
    var p = Promise.resolve([1,2,3]);
    return p.then(function(v) {
      return cache.get('response');
    });
  } else {
    // console.log('New access token');
  }
  var options = {
    method: 'POST',
    data: {
      code: this.options.code, 
      grant_type: 'authorization_code'
    },
    headers: {
      Authorization: 'Basic ' + new Buffer(this.options.clientId + ':' + this.options.clientSecret).toString('base64')
    }
  }
  return this.requestManager('/oauth2/token', options, function(err, data) {
    if(data) {
      this.options.accessToken = data.access_token;
      this.options.store = data.store_id;
      this.options.bearer = 'Bearer ' + this.options.accessToken;
      cache.set('access_token', this.options.accessToken);
      cache.set('store_id', this.options.store);
      cache.set('code', this.options.code);
      cache.set('response', data);
    }
  }.bind(this));
};

/**
 * Me
 * @param  {string}   path
 * @param  {object}   query
 * @return {object}            
 */
Client.prototype.me = function(callback) {
  var options = {
    method: 'GET'
  }
  return this.requestManager('me', options, callback);
};

/**
 * Get store
 * @param  {object}   query    
 * @param  {Function} callback 
 * @return {object}            
 */
Client.prototype.store = function(callback) {
  return this.requestManager('', null, callback);
};

/**
 * POST
 * @param  {string}   path
 * @param  {object}   query
 * @return {object}            
 */
Client.prototype.post = function(path, data, callback) {
  var options = {
    method: 'POST',
    data: data
  }
  return this.requestManager(path, options, callback);
};

/**
 * GET
 * @param  {string}   path
 * @param  {object}   query
 * @return {object}            
 */
Client.prototype.get = function(path, query, callback) {
  var options = {
    method: 'GET',
    query: query
  }
  return this.requestManager(path, options, callback);
};

/**
 * PUT
 * @param  {string}   path
 * @param  {object}   query
 * @return {object}            
 */
Client.prototype.put = function(path, data, callback) {
  var options = {
    method: 'PUT',
    data: data
  }
  return this.requestManager(path, options, callback);
};

/**
 * DELETE
 * @param  {string}   path
 * @return {object}            
 */
Client.prototype.del = function(path, callback) {
  var options = {
    method: 'DELETE'
  }
  return this.requestManager(path, options, callback);
};

exports.Client = Client;














































// /**
//  * Get all pages
//  * @param  {object}   query    
//  * @param  {Function} callback 
//  * @return {object}            
//  */
// Client.prototype.pages = function(query, callback) {
//   this.items({'group[$eq]': 'pages'}, callback);
//   // var self = this;
//   // this.items({'group[$eq]': 'pages'}, function(err, data) {
//   //   var pages = data;
//   //   if(err) {
//   //     callback(err);
//   //   } else {
//   //     var pages = self._makeFlatTree(pages);
//   //     //console.log(pages);
//   //     callback(null, pages);
//   //   }
//   // })
// };

// /**
//  * Get all routes
//  * Routes are created from the pages created in the CMS
//  * @param  {object}   query
//  * @param  {Function} callback 
//  * @return {object}            
//  */
// Client.prototype.routes = function(query, callback) {
//   var self = this;
//   this.items(
//     {
//       'group[$eq]': 'pages',
//       'select': 'slug name parent start_page __meta.properties.position __meta.item_type __meta.id'
//     },
//     function(err, data) {
//       var pages = data;
//       if(err)  {
//         callback(err);
//       } else {
//         var routes = self._makeFlatTree(pages);
//         callback(null, routes);
//       }
//     }
//   )
// };

// /**
//  * Private methods
//  */

// Client.prototype._getTasks = function(data, self) {
//   var tasks = {};
//   for(var i in data) {
//     var prop = data[i];
//     prop = prop.toString();
//     prop = ~prop.indexOf('{') ? prop = JSON.parse(prop) : prop;
//     if(prop && prop.linkage) {
//       tasks[prop.linkage.id] = getTask(prop.linkage);
//     }
//   }
//   function getTask(props) {
//     var task = function (callback) {
//       self.getItem(props.id, {}, function(err, item) {
//         if(err) {
//           callback(err);
//         } else {
//           callback(null, item);
//         }
//       })
//     }
//     return task;
//   }
//   return tasks;
// }

// Client.prototype._addLinks = function(data, links) {
//   var newData = {};
//   for(var i in data) {
//     var prop = data[i];
//     prop = prop.toString();
//     prop = ~prop.indexOf('{') ? prop = JSON.parse(prop) : prop;
//     if(prop && prop.linkage) {
//       for(var linkId in links) {
//         if(linkId === prop.linkage.id) {
//           newData[i] = links[linkId];
//         }
//       }
//     } else {
//       newData[i] = data[i];
//     }

//   }
//   return newData;
// }

// Client.prototype._makeFlatTree = function(items, parentId) {
//   var treeItems = {};
//   parentId = parentId || '';
//   for(var i in items) {
//     var item = items[i];
//     if(parentId === item.parent) {
//       //delete item.__meta.id;
//       //delete item.__meta.properties;
//       //delete item.parent;
//       item.path = this._getPath(item, items);
//       treeItems[item.path] = item;
//       var children = this._makeFlatTree(items, item.__meta.id);
//       item.has_children = Object.keys(children).length > 0;
//       for(var i1 in children) {
//         var item1 = children[i1];
//         treeItems[item1.path] = item1;
//       }
//       //item.has_children = item.children.length > 0;
      
//     } 
//   }
//   return treeItems;
// };

// Client.prototype._makeTree = function(items, parentId) {
//   var treeItems = [];
//   parentId = parentId || '';
//   for(var i in items) {
//     var item = items[i];
//     if(parentId === item.parent) {
//       item.children = this._makeTree(items, item.__meta.id);
//       item.has_children = item.children.length > 0;
//       item.path = this._getPath(item, items);
//       //delete item.__meta.id;
//       //delete item.__meta.properties;
//       //delete item.parent;
//       treeItems.push(item);
//     } 
//   }
//   return treeItems;
// };

// Client.prototype._getPath = function(item, items) {
//   var path = '/' + item.slug;
//   var parentId = item.parent;
//   while (parentId !== '') {
//     for(var i in items) {
//       var item = items[i];
//       if(item.__meta.id === parentId) {
//         path = '/' + item.slug + path;
//         parentId = item.parent;
//         break;
//       }
//     }
//   }
//   return path;
// };

// Client.prototype._parseDeepList = function(list) {
//   for(var key in list) {
//     var item = list[key];
//     for(var key1 in item) {
//       if(~item[key1].toString().indexOf('{')) {
//         item[key1] = JSON.parse(item[key1]);
//       }
//     }
//   }
//   return list;
// };

// Client.prototype._parseDeepObject = function(obj) {
//   for(var key in obj) {
//     var item = obj[key];
//     if(~item.toString().indexOf('{')) {
//       obj[key] = JSON.parse(item);
//     }
//   }
//   return obj;
// };

// items - deferred
// Client.prototype.items = function(query) {
//   var endpoint = 'http://localhost:8080/v1/sites/site/entries/';
//   query = query ? query : {};
//   query._username = this.options.username;
//   query._password = this.options.password;
//   var deferred = Q.defer();
//   request
//     .get(endpoint)
//     .query(query)
//     .set('Accept', 'application/json')
//     .end(function(err, res) {
//       if(res.status === 200)  {
//         deferred.resolve(res.body);
//       } else {
//         deferred.reject(err);
//       }
//     });
//   return deferred.promise;
// };

// items
// Client.prototype.items = function(q, callback) {
//   var path = '/v1/sites/site/entries/';
//   q = q ? q : {};
//   q._username = this.options.username;
//   q._password = this.options.password;
//   var qs = '?' + querystring.stringify(q);
//   //console.log(qs);
//   var postheaders = {
//     'Origin' : 'http://localhost:3000',
//   };
//   this.options.path = path + qs;
//   this.options.method = 'GET';
//   this.options.headers = null;
//   var self = this;
//   var reqGet = http.request(this.options, function(res) {
//     //console.log(self.options);
//     var buffer = '';
//     var data;
//     var route;
//     res.on('data', function(d) {
//         buffer += d;
//     });
//     res.on('end', function () {
//         if(buffer === 'Unauthorized')  {
//           callback('Unauthorized');
//         } else if(buffer === 'Bad Request')  {
//           callback('Bad request');
//         } else {
//           data = JSON.parse(buffer);
//           callback(null, data);
//         }
//     });
//   });
//   reqGet.end();
//   reqGet.on('error', function(e) {
//     callback(e);
//   });
// };

// post
// ApiManager.prototype.post = function(path, data, callback) {
//     data._username = this.username;
//     data._password = this.password;
//     var jsonObject = JSON.stringify(data);
//     //console.log(jsonObject);
//     var postheaders = {
//       'Content-Type' : 'application/json',
//       'Content-Length' : Buffer.byteLength(jsonObject, 'utf-8')
//     };

//     this.options.path = path;
//     this.options.method = 'POST';
//     this.options.headers = postheaders;

//     var reqPost = http.request(this.options, function(res1) {
//       var buffer = '', data, route;
//       res1.on('data', function(d) {
//         buffer += d;
//       });
//       res1.on('end', function (err) {
//         data = JSON.parse(buffer);
//         callback(null, data);
//       });
//     });

//     // write the json data
//     reqPost.write(jsonObject);
//     reqPost.end();
//     reqPost.on('error', function(e) {
//       callback(e + '66666');
//     });
// };


// put
// ApiManager.prototype.put = function(path, data, callback) {
//     var jsonObject = JSON.stringify(data);

//     var postheaders = {
//       'Content-Type' : 'application/json',
//       'Content-Length' : Buffer.byteLength(jsonObject, 'utf-8')
//     };

//     this.options.path = path + this.queryStr;
//     this.options.method = 'PUT';
//     this.options.headers = postheaders;

//     var reqPost = http.request(this.options, function(res) {
//       var buffer = '', data, route;
//       res.on('data', function(d) {
//           console.info('PUT result:\n');
//           buffer += d;
//           process.stdout.write(d);
//           console.info('\n\nPUT completed');
//       });
//       res.on('end', function (err) {
//         data = JSON.parse(buffer);
//         callback(null, data);
//       });
//     });

//     // write the json data
//     reqPost.write(jsonObject);
//     reqPost.end();
//     reqPost.on('error', function(e) {
//       callback('what');
//     });
// };

// delete
// ApiManager.prototype.delete = function(path, callback) {
//   jsonObject = JSON.stringify({});

//   var postheaders = {
//     'Content-Type' : 'application/json',
//     'Content-Length' : Buffer.byteLength(jsonObject, 'utf-8')
//   };

//   this.options.path = path + this.queryStr;
//   this.options.method = 'DELETE';
//   this.options.headers = postheaders;

//   var reqPost = http.request(this.options, function(res1) {
//     var buffer = '', data, route;
//     res1.on('data', function(d) {
//         console.info('POST result:\n');
//         buffer += d;
//         process.stdout.write(d);
//         console.info('\n\nPOST completed');
//     });
//     res1.on('end', function (err) {
//           data = JSON.parse(buffer);
//           callback(null, data);
//           //res.render('test', {objects: data});
//       });
//   });

//   // write the json data
//   reqPost.write(jsonObject);
//   reqPost.end();
//   reqPost.on('error', function(e) {
//     callback(e);
//   });
// };



// testing async
  // var arrFunc = [];
  // arrFunc[0] = function(callback){
  //     setTimeout(function(){
  //         callback(null, 'onei');
  //     }, 200);
  // }
  // arrFunc[1] = function(callback){
  //     setTimeout(function(){
  //         callback(null, 'twoi');
  //     }, 100);
  // }
  // async.parallel(arrFunc,
  // // optional callback
  // function(err, results){
  //   console.log(results);
  //   // results is now equal to ['one', 'two']
  // }); 
  
  // async.series([
  //   function (callback) {
  //     request
  //       .get(endpoint)
  //       .query(query)
  //       .set('Accept', 'application/json')
  //       .end(function(err, res) {
  //         if(err)  {
  //           callback(err);
  //         } else {
  //           callback(null, 'one');
  //         }
  //       });
  //     //callback(null, 'one');
  //   },
  //   function (callback) {
  //       console.log('heheh: ' + callback);
  //       callback (null, 'two');
  //   }
  // ],
  // // optional callback
  // function(err, results){
  //   console.log(results);
  //   // results is now equal to ['one', 'two']
  // });