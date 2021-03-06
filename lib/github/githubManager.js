var async = require('async');
var github = require('octonode');

var username = 'cloudpen-templates';
var client = github.client(process.env.GITHUB_TEMPLATES_API_KEY);

module.exports = {
  exportTemplate: function(repoName, cb) {
    var self = this;
    var repoNameSha;
    this.getCommits(repoName, function(err, body) {
      var repoNameSha = body[0].commit.tree.sha;
      self.getTree(repoNameSha, repoName, function(err, body) {
        var tree = body.tree;
        //console.log(JSON.stringify(tree));
        var tasks = self.getFileTasks(tree, repoName);
        async.parallel(tasks,
        function (err, result) {
          if(err) {
            cb(err);  
          } else {
            //var fs = require("fs");
            // var zip = new require('node-zip')();
            // for (var i=0; i < result.length; i++) {
            //   var file = result[i];
            //   zip.file(file.filePath, file.content);
            // }
            // var data = zip.generate({base64:false,compression:'DEFLATE'});
            // fs.writeFileSync('test.zip', data, 'binary');

            // var zip = new require('node-zip')();
            // zip.file('test.file', 'hello there');
            // var data = zip.generate({base64:false,compression:'DEFLATE'});
            // console.log(data); // ugly data

            // var JSZip = require('jszip');
            // var zip = new JSZip();
            // zip.file('Hello.txt', 'Hello world\n');
            // var data = zip.generate({type: "blob"});

            //var zip = new require('node-zip')();
            //zip.file(result[0].filePath, result[0].content);
            //zip.file('test.file', 'hello there');
            //var data = zip.generate({base64: false, compression: 'DEFLATE'});
            //var dataZip = new JSZip(zip);
            cb(err, result);
            // var fs = require('fs');
            // fs.writeFile('temp-files/' + result[0].filePath, result[0].content, 'utf8', function(error) {
            //   cb(err, result);
            // })
          }
        });
      });
    });
  },

  getFileTasks: function(tree, repoName) {
    var self = this;
    var tasks = [];
    for (var i = 0; i < tree.length; i++) {
      var file = tree[i];
      var filePath = file.path;
      var path = file.path;
      tasks.push(createFileTask(filePath, path, file.sha));
    }
    function createFileTask(filePath, path, sha) {
      var task = function(callback) {
        if (~filePath.indexOf('.')) {
          self.getBlob(sha, repoName, function(err, response) {
            if(typeof response !== 'undefined') {
              var encoding = 'base64';
              // if
              // (
              //   ~filePath.indexOf('.png')    ||
              //   ~filePath.indexOf('.jpg')    ||
              //   ~filePath.indexOf('.eot')    ||
              //   ~filePath.indexOf('.svg')    ||
              //   ~filePath.indexOf('.ttf')    ||
              //   ~filePath.indexOf('.woff')   ||
              //   ~filePath.indexOf('.woff2')  ||
              //   ~filePath.indexOf('.otf')
              // )
              // {
              //   encoding = 'base64';
              // }
              //var content = new Buffer(response.content, 'base64').toString(encoding);
              var content = response.content;
              var o = {
                path: filePath,
                content: content
              }
              callback(null, o);
            } else {
              var o = {
                path: filePath,
                dir: filePath,
                content: null
              }
              callback(null, o);
            }
          });
        } else {
          var o = {
            path: filePath,
            dir: filePath,
            content: null
          }
          callback(null, o);
        }
      }
      return task;
    }
    return tasks;
  },

  getTree: function(sha, repoName, callback) {
    var repo = client.repo(username + '/' + repoName);
    repo.tree(sha, true, function(err, body) {
      callback(err, body);
    });
  },

  getCommits: function(repoName, callback) {
    var repo = client.repo(username + '/' + repoName);
    repo.commits(function(err, body) {
      callback(err, body);
    });
  },

  getBlob: function(sha, repoName, callback) {
    var repo = client.repo(username+'/'+repoName);
    repo.blob(sha, function(err, body) {
      callback(err, body);
    });
  },
};