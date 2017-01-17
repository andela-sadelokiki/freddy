'use strict';

var angular = require('angular');

angular.module('freddyApp').service('dataService', require('./data'));

angular.module('freddyApp').factory('mySocket', function (socketFactory) {
  var mySocket = socketFactory();
  mySocket.forward('error');
  return mySocket;
});