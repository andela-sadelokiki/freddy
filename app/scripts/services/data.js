'use strict';

function DataService ($http, $q, mySocket) {

  this.getUser = function(cb, cb2) {
    $http.get('/user').then(cb).finally(cb2);
  };

  this.getPeopleResults = function(input, cb){
    $http.get('/usersearch/' + input).then(cb);
  };

  this.getUsername = function(id, cb) {
    $http.get('/username/' + id).then(cb);
  };

  this.getPerson = function(id, cb) {
    $http.get('/person/' + id).then(cb);
  };

  this.addNewChatToDb = function(chat, cb){
    $http.post('/chat/', chat).then(cb);
  };

  this.getChat = function(reqBody, cb) {
    $http.get('/chat/' + reqBody.id, reqBody).then(cb);
  };

  this.updateChat = function(id, cb){
    $http.get('/updateChat/' + id).then(cb);
  };

  this.submitMessageToChat = function(reqBody, cb) {
    $http.put('/chat/' + reqBody.id, reqBody).then(cb);
  };

  this.updateUserToDatabase = function(reqBody, cb){
  	$http.put('/user/' + reqBody.user._id, reqBody).then(cb);
  };

}

module.exports = DataService;

