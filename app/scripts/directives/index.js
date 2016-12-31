'use strict';

var angular = require('angular');

angular.module('freddyApp').directive('me', require('./me'));
angular.module('freddyApp').directive('messages', require('./messages'));
angular.module('freddyApp').directive('search', require('./search'));
angular.module('freddyApp').directive('profile', require('./profile'));
angular.module('freddyApp').directive('messageContent', require('./message-content'));