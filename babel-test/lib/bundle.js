"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Polygon = function Polygon(height, width) {
  _classCallCheck(this, Polygon);

  this.height = height;
  this.width = 8;
};
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var swig = require('swig');
var async = require('async');
var client = require('./cms-client.js');
var conf = require('nconf');

module.exports = function (app) {
  app.use(function (req, res, next) {
    var Polygon = function Polygon(height, width) {
      _classCallCheck(this, Polygon);

      this.height = height;
      this.width = width;
    };

    next();
  });
};
