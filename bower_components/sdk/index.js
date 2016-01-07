var merge = require('merge');
var request = require('superagent'); 
var Q = require('q');
var async = require('async'); 

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
    host : 'localhost',
    port : null,
    username : 'gabriel',
    password : 'rellim77',
    accessToken : null
  };
  this.options = merge.recursive(this.defaults, options);
  this.options.http = !this.options.secure ? 'http' : this.options.http; 
  this.options.uri = this.options.http + '://' + this.options.host + (this.options.port ? ':' + this.options.port : ''); 
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
  var self = this;
  query = this._setQuery(query);
  //console.log('hehe', query.access_token);
  //console.log('hehe', endpoint);
  request
    .get(endpoint)
    .query(query)
    .set('Accept', 'application/json')
    .end(function(err, res) {
      if(err)  {
        callback(err);
      } else {
        // if(query.get_links) {
        //   var tasks = self._getTasks(res.body, self);
        //   async.parallel(tasks,
        //   function(err, links) {
        //     var data = self._addLinks(res.body, links);
        //     //console.log(data);
        //     callback(null, self._parseDeepObject(data));
        //   });  
        // } else {
          //callback(null, self._parseDeepList(res.body));
          callback(null, res.body.data);
        //}
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
  this.request('/items/', query, callback);
};

/**
 * Get meta
 * @param  {object}   query    
 * @param  {Function} callback 
 * @return {object}            
 */
Client.prototype.meta = function(query, callback) {
  this.request('/meta/', query, callback);
};

/**
 * Get item types
 * @param  {object}   query    
 * @param  {Function} callback 
 * @return {object}            
 */
Client.prototype.itemTypes = function(query, callback) {
  this.request('/item-types/', query, callback);
};

/**
 * Get item
 * @param  {object}   query    
 * @param  {Function} callback 
 * @return {object}            
 */
Client.prototype.getItem = function(id, query, callback) {
  this.request('/entries/' + id, query, callback);
};

/**
 * Get all pages
 * @param  {object}   query    
 * @param  {Function} callback 
 * @return {object}            
 */
Client.prototype.pages = function(query, callback) {
  this.items({'group[$eq]': 'pages'}, callback);
  // var self = this;
  // this.items({'group[$eq]': 'pages'}, function(err, data) {
  //   var pages = data;
  //   if(err) {
  //     callback(err);
  //   } else {
  //     var pages = self._makeFlatTree(pages);
  //     //console.log(pages);
  //     callback(null, pages);
  //   }
  // })
};

/**
 * Get all routes
 * Routes are created from the pages created in the CMS
 * @param  {object}   query
 * @param  {Function} callback 
 * @return {object}            
 */
Client.prototype.routes = function(query, callback) {
  var self = this;
  this.items(
    {
      'group[$eq]': 'pages',
      'select': 'slug name parent start_page __meta.properties.position __meta.item_type __meta.id'
    },
    function(err, data) {
      var pages = data;
      if(err)  {
        callback(err);
      } else {
        var routes = self._makeFlatTree(pages);
        callback(null, routes);
      }
    }
  )
};

/**
 * Private methods
 */

Client.prototype._getTasks = function(data, self) {
  var tasks = {};
  for(var i in data) {
    var prop = data[i];
    prop = prop.toString();
    prop = ~prop.indexOf('{') ? prop = JSON.parse(prop) : prop;
    if(prop && prop.linkage) {
      tasks[prop.linkage.id] = getTask(prop.linkage);
    }
  }
  function getTask(props) {
    var task = function (callback) {
      self.getItem(props.id, {}, function(err, item) {
        if(err) {
          callback(err);
        } else {
          callback(null, item);
        }
      })
    }
    return task;
  }
  return tasks;
}

Client.prototype._addLinks = function(data, links) {
  var newData = {};
  for(var i in data) {
    var prop = data[i];
    prop = prop.toString();
    prop = ~prop.indexOf('{') ? prop = JSON.parse(prop) : prop;
    if(prop && prop.linkage) {
      for(var linkId in links) {
        if(linkId === prop.linkage.id) {
          newData[i] = links[linkId];
        }
      }
    } else {
      newData[i] = data[i];
    }

  }
  return newData;
}

Client.prototype._makeFlatTree = function(items, parentId) {
  var treeItems = {};
  parentId = parentId || '';
  for(var i in items) {
    var item = items[i];
    if(parentId === item.parent) {
      //delete item.__meta.id;
      //delete item.__meta.properties;
      //delete item.parent;
      item.path = this._getPath(item, items);
      treeItems[item.path] = item;
      var children = this._makeFlatTree(items, item.__meta.id);
      item.has_children = Object.keys(children).length > 0;
      for(var i1 in children) {
        var item1 = children[i1];
        treeItems[item1.path] = item1;
      }
      //item.has_children = item.children.length > 0;
      
    } 
  }
  return treeItems;
};

Client.prototype._makeTree = function(items, parentId) {
  var treeItems = [];
  parentId = parentId || '';
  for(var i in items) {
    var item = items[i];
    if(parentId === item.parent) {
      item.children = this._makeTree(items, item.__meta.id);
      item.has_children = item.children.length > 0;
      item.path = this._getPath(item, items);
      //delete item.__meta.id;
      //delete item.__meta.properties;
      //delete item.parent;
      treeItems.push(item);
    } 
  }
  return treeItems;
};

Client.prototype._getPath = function(item, items) {
  var path = '/' + item.slug;
  var parentId = item.parent;
  while (parentId !== '') {
    for(var i in items) {
      var item = items[i];
      if(item.__meta.id === parentId) {
        path = '/' + item.slug + path;
        parentId = item.parent;
        break;
      }
    }
  }
  return path;
};

Client.prototype._setQuery = function(query) {
  query = query ? query : {};
  query._username = this.options.username;
  query._password = this.options.password;
  if (this.options.accessToken) {
    query.access_token = this.options.accessToken;
  }
  return query;
};

Client.prototype._parseDeepList = function(list) {
  for(var key in list) {
    var item = list[key];
    for(var key1 in item) {
      if(~item[key1].toString().indexOf('{')) {
        item[key1] = JSON.parse(item[key1]);
      }
    }
  }
  return list;
};

Client.prototype._parseDeepObject = function(obj) {
  for(var key in obj) {
    var item = obj[key];
    if(~item.toString().indexOf('{')) {
      obj[key] = JSON.parse(item);
    }
  }
  return obj;
};

exports.Client = Client;

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