var swig = require('swig');
var async = require('async');
var client = require('./cms-client.js'); 
var conf = require('nconf');

module.exports = function(app) {
  app.use(function(req, res, next) {   
    class Polygon {
        constructor(height, width) {
          this.height = height;
          this.width = width;
        }
      }
    next();
  });
};