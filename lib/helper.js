var github = require('./github/githubManager');

module.exports = {
  installTemplate: function(repoName, cb) {
    github.exportTemplate(repoName, function(err, files) {
      if(err) {
        cb(err);
      } else {
        var fs = require('fs-extra')
        var templateRoot = 'template';
        fs.remove(templateRoot, function() {
          fs.existsSync(templateRoot) || fs.mkdirSync(templateRoot);
          for (var i=0; i < files.length; i++) {
            var file = files[i];
            if(file.dir) {
              fs.existsSync(templateRoot + '/' + file.fileName) || fs.mkdirSync(templateRoot + '/' + file.fileName);
            }
            fs.writeFile(templateRoot + '/' + file.fileName, file.content, 'utf8', function(err) {
              console.log(err)
            })
          }
          cb(null, files);  
        });
      }
    });
  }
};




