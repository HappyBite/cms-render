var github = require('./github/githubManager');
var request = require('superagent'); 

module.exports = {
  installTemplate: function(repoName, templateExist, cb) {
    var self = this;
    if (templateExist) {
      github.exportTemplate(repoName, function(err, files) {
        if(err) {
          cb(err);
        } else {
          self.installTemplate1(files, function(err, result) {
            cb(null, result);    
          });
        }
      });
    } else {
      var url = 'https://cms-1.herokuapp.com/templates/json/' + repoName;
      request
      .get(url)
      .set('Accept', 'application/json')
      .end(function(err, files) {
        if(err) {
          cb(err);
        } else {
          files = files.body;
          // console.log(files);
          self.installTemplate1(files, function(err, result) {
            cb(null, result);    
          });
        }
      });
    }
  },

  installTemplate1: function(files, cb) {
    var self = this;
    var filePath;
    var fs = require('fs-extra');
    var templateRoot = 'template';
    fs.remove(templateRoot, function() {
      fs.existsSync(templateRoot) || fs.mkdirSync(templateRoot);
      for (var i=0; i < files.length; i++) {
        var file = files[i];
        if(file.dir) {
          fs.existsSync(templateRoot + '/' + file.dir) || fs.mkdirSync(templateRoot + '/' + file.dir);
          filePath = file.dir;
        } else {
          filePath = file.path;
        }
        if(!filePath) {
          filePath = '';
        }
        var encoding = 'binary';
        var fileEncoding = 'binary';
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
        //   if (file.content) {
        //     file.content = file.content.replace(/\n/g, '');
        //   }
        //   if(file.content && !self.isBase64(file.content)) {
        //     console.log(self.isBase64(file.content));
        //     encoding = 'utf8';
        //     fileEncoding = 'base64';
        //   }
        // }
        var content = file.content ? new Buffer(file.content, 'base64').toString(encoding) : file.content;
        fs.writeFile(templateRoot + '/' + filePath, content, fileEncoding, function(err) {
          // console.log(err)
        })
      }
      cb(null, files);  
    });   
  },

  updateFile: function(filePath, content, cb) {
    var templateRoot = 'template';
    var fs = require('fs-extra')
    var encoding = 'utf8';
    var fileEncoding = 'utf8';
    // var content = content ? new Buffer(content, 'base64').toString(encoding) : content;
    var content = new Buffer(content, encoding).toString(encoding);
    fs.writeFile(templateRoot + '/' + filePath, content, fileEncoding, function(err) {
      // console.log(err)
    })
    cb(null, 'Updated');  
  },

  isBase64: function(str) {
    if (str) {
      str = str.replace(/\n/g, '');
    }
    var notBase64 = /[^A-Z0-9+\/=]/i;
    var len = str.length;
    if (!len || len % 4 !== 0 || notBase64.test(str)) {
      return false;
    }
    var firstPaddingChar = str.indexOf('=');
    return firstPaddingChar === -1 || firstPaddingChar === len - 1 || firstPaddingChar === len - 2 && str[len - 1] === '=';
  }
};




