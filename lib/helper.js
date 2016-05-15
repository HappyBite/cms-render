var github = require('./github/githubManager');
var request = require('superagent');
var conf = require('nconf');
require('shelljs/global');

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
    var dir;
    if (~filePath.indexOf('/')) {
      dir = templateRoot + '/' + filePath.substring(0, filePath.lastIndexOf('/'));
      fs.existsSync(dir) || fs.mkdirSync(dir);  
    }
    // console.log(dir);
    // var content = content ? new Buffer(content, 'base64').toString(encoding) : content;
    var content = new Buffer(content, encoding).toString(encoding);
    fs.writeFile(templateRoot + '/' + filePath, content, fileEncoding, function(err) {
      // console.log(err)
    })
    cb(null, 'Updated');  
  },

  deleteFile: function(filePath, cb) {
    var templateRoot = 'template';
    var fs = require('fs-extra')
    var encoding = 'utf8';
    var fileEncoding = 'utf8';
    fs.remove(templateRoot + '/' + filePath, function (err) {
      // console.log('success!')
    })
    cb(null, 'Deleted');  
  },

  gitPull: function(repoName, cb) {
    var templateRoot;
    var config = conf.get('config');
    var repo = 'https://github.com/cloudpen-templates/' + repoName + '.git';
    if (config) {
      var local_repo_name = config.env.local_repo_name.length ? ' ' + config.env.local_repo_name : '';
      var local_repo_name_1 = config.env.local_repo_name.length ? config.env.local_repo_name : config.env.repo_name;
      templatesPath = config.env.repo_path + '/';
      templatePath = templatesPath + local_repo_name_1;
      var currentDir = pwd();
      if (!test('-d', templatePath)) {
        console.log('1!!!');
        if (test('-d', templatesPath)) {
          cd(templatesPath);
          var clonedRepo = exec('git clone ' + repo + local_repo_name);
          console.log('clonedRepo: ', clonedRepo);
        };
        // var clonedRepo = exec('git clone ' + repo);
        // console.log('clonedRepo: ', clonedRepo);
        // cb(null, 'Git pull updated'); 
      } else {
        console.log('2!!!');
        cd(templatePath);
        var pullRepo = exec('git pull' + local_repo_name);
        console.log('pullRepo: ', pullRepo);
        // cd('../');
        // exec('git remote set-url dokku dokku@cloudpen.io:' + appName);
      }
      cd(currentDir);
      cb(null, 'Git pull updated');
    } else {
      templateRoot = 'template';
      if (!test('-d', templateRoot)) {
        console.log('one!!!');
        var clonedRepo = exec('git clone ' + repo + ' ' + templateRoot);
        console.log('clonedRepo: ', clonedRepo);
      } else {
        console.log('two!!!');
        cd(templateRoot);
        exec('git pull');
        cd('../');
        // exec('git remote set-url dokku dokku@cloudpen.io:' + appName);
      }
      cb(null, 'Git pull updated');  
    }
    // if (!test('-d', 'repos/' + repoName)) {
    //   console.log('one!!!');
    //   // var repo = 'https://github.com/happybite/cms-render.git';
    //   // repo = 'https://glantz@bitbucket.org/glantz/cms.git';
    //   mkdir('-p', 'repos');  
    //   cd('repos');
    //   var clonedRepo = exec('git clone ' + repo + ' ' + templateRoot);
    //   cd(repoName);
    //   console.log('clonedRepo: ', clonedRepo);
    //   // exec('git remote add dokku dokku@cloudpen.io:' + appName);
    // } else {
    //   console.log('two!!!');
    //   cd('repos/' + repoName);
    //   exec('git pull');
    //   // exec('git remote set-url dokku dokku@cloudpen.io:' + appName);
    // }
    // var createApp = exec(dokkuStr + ' apps:create ' + appName);
    // exec('git remote -v');
    // exec('git remote -v');
    // exec(dokkuStr + ' config:set ' + appName + ' STORE_ID=56e55d8ddf16368aad7c4dce');
    // exec(dokkuStr + ' config:set ' + appName + ' GITHUB_TEMPLATES_API_KEY=aa08ed067a94175cb7cea63075a961d80ea85479');
    // exec('git push dokku master');
    // exec(dokkuStr + ' config:set ' + appName + ' ACCESS_TOKEN=56e55d90df16368aad7c4dd1 STORE_ID=56e55d8ddf16368aad7c4dce GITHUB_TEMPLATES_API_KEY=aa08ed067a94175cb7cea63075a961d80ea85479', {silent:true});
    // exec(dokkuStr + ' config:set --no-restart' + appName + ' ACCESS_TOKEN=56e55d90df16368aad7c4dd1 STORE_ID=56e55d8ddf16368aad7c4dce GITHUB_TEMPLATES_API_KEY=aa08ed067a94175cb7cea63075a961d80ea85479', {silent:true});
    // exec(dokkuStr + ' ps:rebuild ' + appName);
    
    // cd('../..');
    // // exec('rm -rf repos');
    // cb(null, 'Git pull updated');
  },

  setConfig: function(bucketId, accessToken, repoName, repoPath, localRepoName, cb) {
    var fs = require('fs-extra')
    var configFile = 'config.json';
    var config = conf.get('config');
    if (!config) {
      conf.set('config', {env: {}});
      config = conf.get('config'); 
    }
    config.env.bucket_id = bucketId;
    config.env.access_token = accessToken;
    config.env.repo_name = repoName;
    config.env.repo_path = repoPath;
    config.env.local_repo_name = localRepoName;
    fs.removeSync('template');
    fs.removeSync(configFile);
    fs.outputFile(configFile, JSON.stringify(config, null, '\t'), function(err) {
      cb(null, 'Updated');
    })
    // BUCKET_ID=573721dac1f469392e54a683
    // ACCESS_TOKEN=573721dfc1f469392e54a686
    // REP=cloudpen-template-basic
    // GITHUB_TEMPLATES_API_KEY=aa08ed067a94175cb7cea63075a961d80ea85479
  },

  setEnv: function(bucketId, accessToken, repo, cb) {
    var fs = require('fs-extra')
    var envFile = '.env';
    var str = '';
    str += 'BUCKET_ID=' + bucketId;
    str += '\n';
    str += 'ACCESS_TOKEN=' + accessToken;
    str += '\n';
    str += 'REPO=' + repo;
    str += '\n';
    str += 'GITHUB_TEMPLATES_API_KEY=aa08ed067a94175cb7cea63075a961d80ea85479';
    // fs.removeSync('test.js');
    // fs.outputFile('test.js', 'gaga', function(err) {})
    fs.removeSync('template');
    fs.removeSync(envFile);
    fs.outputFile(envFile, str, function(err) {
      cb(null, 'Updated');
    })
    // BUCKET_ID=573721dac1f469392e54a683
    // ACCESS_TOKEN=573721dfc1f469392e54a686
    // REP=cloudpen-template-basic
    // GITHUB_TEMPLATES_API_KEY=aa08ed067a94175cb7cea63075a961d80ea85479
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




