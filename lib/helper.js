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
            var encoding = 'binary';
            var content = file.content ? file.content.toString(encoding) : file.content;
            fs.writeFile(templateRoot + '/' + file.fileName, content, encoding, function(err) {
              console.log(err)
            })
          }
          cb(null, files);  
        });
      }
    });
  }
};




