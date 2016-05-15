module.exports = function(grunt) {
  grunt.initConfig({
    nodemon: {
      dev: {
        script: 'server.js',
        options: { 
          ignore: ['template', 'config.json']
        }  
      }
    }
  });
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.registerTask('default', ['nodemon']);
};