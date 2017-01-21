'use strict';

var angular = require('angular');
console.log(angular, "load here");
angular.module('freddyApp', []);

require('./scripts/services');
require('./scripts/directives');
require('./scripts/controllers');

console.log('App.js has been properly loaded')
