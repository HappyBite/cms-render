var github = require('./github/githubManager');
var request = require('superagent');
var conf = require('nconf');
require('shelljs/global');

module.exports = {
  gitPull: function(repoName, env, tag, cb) {
    var repo = 'https://github.com/cloudpen-templates/' + repoName + '.git';
    var templatesRoot = 'templates';
    var templateRoot;
    var config = conf.get('config');
    env = env || 'dev';
    if (env === 'prod') {
      templateRoot = 'template-prod';
    } else {
      tag = tag || 'master';
      templateRoot = 'template-dev';
    }
    if (!test('-d', templatesRoot + '/' + templateRoot)) {
      var clonedRepo = exec('git clone ' + repo + ' ' + templatesRoot + '/' + templateRoot);
      if (env === 'prod') {
        if (config) {
          tag = config.env.tag;
          cd(templatesRoot + '/' + templateRoot);
        } else {
          tag = Date.now();
          this.setTag(tag);
          cd(templatesRoot + '/' + templateRoot);
          exec('git tag -a ' + tag + ' -m "New version"');
          exec('git push --tags');
        }
      } else {
        cd(templatesRoot + '/' + templateRoot);
      }
      exec('git checkout ' + tag);
      exec('git pull');
      cd('../../');
    } else {
      console.log('Setting ' + env + ' environment!!!');
      if (!tag) {
        tag = Date.now();
        this.setTag(tag);
        cd(templatesRoot + '/' + templateRoot);
        exec('git checkout master');
        exec('git pull');
        exec('git tag -a ' + tag + ' -m "New version"');
        exec('git push --tags');
      } else {
        cd(templatesRoot + '/' + templateRoot);
        exec('git checkout ' + tag);
      }
      exec('git pull');
      cd('../../');
    }
    cb(null, 'Git pull updated');
  },

  setTag: function(tag) {
    var fs = require('fs-extra');
    var configFile = 'config.json';
    var config = conf.get('config');
    if (!config) {
      conf.set('config', {env: {}});
      config = conf.get('config'); 
    }
    config.env.tag = tag;
    fs.removeSync(configFile);
    try {
      fs.outputFileSync(configFile, JSON.stringify(config, null, '\t'));
      console.log('Updated config file successfully');
    } catch (err) {
      console.log('Could\´nt update config file: ', err);
    }
  },

  setEnv: function(bucketId, accessToken, repo, cb) {
    var fs = require('fs-extra')
    var envFile = '.env';
    var str = '';
    str += 'BUCKET_ID=' + bucketId;
    str += '\n';
    str += 'ACCESS_TOKEN=' + accessToken;
    // str += '\n';
    // str += 'REPO=' + repo;
    str += '\n';
    str += 'NODE_ENV=production';
    // str += '\n';
    // str += 'GITHUB_TEMPLATES_API_KEY=aa08ed067a94175cb7cea63075a961d80ea85479';
    fs.removeSync(envFile);
    fs.outputFile(envFile, str, function(err) {
      cb(null, 'Updated');
      // exec('rs');
    })
    fs.removeSync('template');
    fs.outputFile('test.js', 'gaga', function(err) {});
    fs.removeSync('test.js');
    // BUCKET_ID=573721dac1f469392e54a683
    // ACCESS_TOKEN=573721dfc1f469392e54a686
    // REP=cloudpen-template-basic
    // GITHUB_TEMPLATES_API_KEY=aa08ed067a94175cb7cea63075a961d80ea85479
  }
};




