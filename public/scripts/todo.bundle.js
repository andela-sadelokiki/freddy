webpackJsonp([0],[
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var angular = __webpack_require__(1);
	console.log(angular, "load here");
	angular.module('freddyApp', ['btford.socket-io']);

	__webpack_require__(3);
	__webpack_require__(5);
	__webpack_require__(11);

	console.log('App.js has been properly loaded')


/***/ },
/* 1 */,
/* 2 */,
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var angular = __webpack_require__(1);

	angular.module('freddyApp').service('dataService', __webpack_require__(4));

	angular.module('freddyApp').factory('mySocket', function (socketFactory) {
	  var mySocket = socketFactory();
	  mySocket.forward('error');
	  return mySocket;
	});

/***/ },
/* 4 */
/***/ function(module, exports) {

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



/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var angular = __webpack_require__(1);

	angular.module('freddyApp').directive('me', __webpack_require__(6));
	angular.module('freddyApp').directive('messages', __webpack_require__(7));
	angular.module('freddyApp').directive('search', __webpack_require__(8));
	angular.module('freddyApp').directive('profile', __webpack_require__(9));
	angular.module('freddyApp').directive('messageContent', __webpack_require__(10));

/***/ },
/* 6 */
/***/ function(module, exports) {

	'use strict';

	function ProfileDirective () {
			return {
				templateUrl: 'templates/me.html'
			}
	}

	module.exports = ProfileDirective;

/***/ },
/* 7 */
/***/ function(module, exports) {

	'use strict';

	function MessagesDirective () {
			return {
				templateUrl: 'templates/messages.html'
			}
	}

	module.exports = MessagesDirective;



/***/ },
/* 8 */
/***/ function(module, exports) {

	'use strict';

	function SearchDirective () {
			return {
				templateUrl: 'templates/search.html'
			}
	}

	module.exports = SearchDirective;



/***/ },
/* 9 */
/***/ function(module, exports) {

	'use strict';

	function ProfileDirective () {
			return {
				templateUrl: 'templates/profile.html'
			}
	}

	module.exports = ProfileDirective;

/***/ },
/* 10 */
/***/ function(module, exports) {

	'use strict';

	function MessageContentDirective () {
			return {
				templateUrl: 'templates/message-content.html'
			}
	}

	module.exports = MessageContentDirective;



/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var angular = __webpack_require__(1);

	angular.module('freddyApp')
	.controller('mainCtrl', function($scope, dataService, $q, $filter, $timeout, mySocket) {

		 mySocket.on('message', function (data) {
			 console.log("new message", data);
	      // $scope.name = data.name;
	    });

		dataService.getUser(function(response) { 
	    	console.log(response.data);
	    	$scope.user = response.data;
	    }, function(response) {
	    	$scope.loadUserChats();
	    });

		mySocket.on('connect',function(){
			console.log('connected');
		});

		$scope.loadUsersBasicArray = function(IDsArray){
			var usersArray = [];
		 	angular.forEach(IDsArray, function(id){
			 		dataService.getUsername(id, function(response){	
	// 			var list = loadUsernames(response.data);
						var person = response.data;
			 			usersArray.unshift(person);
			 		});
				});
			return usersArray;
		};

		$scope.loadUserChats = function() {
			var chatIds = $scope.user.chats;
			var scopeChats = [];
			var queue = [];
			angular.forEach(chatIds, function(chatId){
				var request;
				var reqBody = {
					id: chatId,
					action: 'basic'
				};
				request = dataService.getChat(reqBody, function(response){
					var chat = response.data.chat;
					var userIDs = chat.users;
					var orderedChatUsersIDS = [];
					angular.forEach(userIDs, function(id){
						if(id !== $scope.user._id){
							orderedChatUsersIDS.push(id);
						}
					});
					var scopeChatUsers = $scope.loadUsersBasicArray(orderedChatUsersIDS);
					chat.users = scopeChatUsers;
					scopeChats.unshift(chat);
				});
				queue.push(request);
			});
			$q.all(queue).then(function(){
				$scope.user.chats = scopeChats;
			})
		};

	//------NAVIGATION BOOLEANS-----//
		$scope.interface = {
			me: true,
			search: false,
			messages: false,
			friends: false,
			messageContent: false,
			profile: false
		};

	//-----NAVIGATION FUNCTIONS---------//
		$scope.go = {
			hideAll: function(){
				$scope.interface.search = false;
				$scope.interface.messages = false;
				$scope.interface.friends = false;
				$scope.interface.me = false;	
				$scope.overlay = false;
				$scope.interface.profile = false;
				$scope.interface.messageContent = false;
			},
			loadSearch: function(){
				$scope.go.hideAll();
				$scope.interface.search = true;
			},
			loadMessages: function(){
				$scope.go.hideAll();
				$scope.interface.messages = true;
			},
			loadMe: function(){
				$scope.go.hideAll();
				$scope.interface.me = true;
				$scope.interface.lists = true;
				$scope.interface.notifications = false;
			},
			closeProfile: function(){
				$scope.overlay = false;
				$scope.interface.profile = false;
			},
			closeMessageContent: function(){
				$scope.overlay = false;
				$scope.interface.messageContent = false;
			},
		};

		$scope.loadMessageContent = function(id){
			$scope.loadChat(id);
			$scope.overlay = true;
			$scope.interface.messageContent = true;
			$scope.updateChatContent($scope.chat._id);
		};

		$scope.loadProfile = function(){
			$scope.overlay = true;
			$scope.interface.profile = true;
			$scope.person = this.user;
		};

	//-----CHAT---------//
		$scope.loadChat = function(id){
			//ao carregar person no servidor, já carrega as ids dos chats dele com o user
				var chats = $scope.user.chats;
				var personId = id;
				var scopeChat = {};
				var found = false;
				angular.forEach(chats, function(chat){
					var user = chat.users[0];

					// if (!chat.group && chat.users[0]._id == personId) {
					if (!chat.group && user) {
						if (user._id == personId) {
							scopeChat = chat;
							found = true;

							if(found){
								$scope.chat = scopeChat;
							} else {
								$scope.addNewChatToDb();
							}
							return;
						}
					}
				});
		};

		$scope.addNewChatToDb = function(){
			var person = $scope.person;
			var user = $scope.user;
			var dbChat = {
				users: [user._id, person._id],
				group: false,
				messages: []
			};
			dataService.addNewChatToDb(dbChat, function(response){
				console.log(response.data.message);
				var chatId = response.data.chat._id;
				var scopeChat = response.data.chat;
				scopeChat.users = $scope.loadUsersBasicArray(response.data.chat.users);
				$scope.chat = scopeChat;

				$scope.user.chats.unshift(scopeChat);
			//then updates user with new chat to user database
				var reqBody = {
					user: {_id: user._id, displayName: user.displayName},
					chat: chatId,
					action: 'newChat'
				};
				var reqBodyPerson = {
					user: {_id: person._id, displayName: person.displayName},
					chat: chatId,
					action: 'newChat'
				};
			//udpate user with chat id
				dataService.updateUserToDatabase(reqBody, function(response){
					console.log(response.data.message);
				});
			//update person with chat id
				dataService.updateUserToDatabase(reqBodyPerson, function(response){
					console.log(response.data.message);
				});
			});
		};

		$scope.submitMessage = function(){
			var time = Date.now();
			var text = $scope.newMessage.text;
			var userID = $scope.user._id;
			var chatID = $scope.chat._id;
			var dbMessage = {
				time: time,
				text: text,
				user: userID
			};
			var reqBody = {
				id: chatID,
				dbMessage: dbMessage
			}
				dataService.submitMessageToChat(reqBody, function(response){
				$scope.newMessage.text = "";
				$scope.updateChatContent(chatID);
				});
			  
			};
		

		$scope.updateChatContent = function(chatId){
			var scopeMessages;
			var userID = $scope.user._id;
			//Pegar 10 mensagens mais recentes do chat
	//		var request = 
			dataService.updateChat(chatId, function(response){
				scopeMessages = response.data.messages;
				angular.forEach(scopeMessages, function(message){
					if(message.user === userID){
						message.me = true;
					} else {
						message.me =false;
					}
				});
				$scope.chat.messages = scopeMessages;
			});

	//		$q.all(request).then(function(){
	//			$scope.chat.messages = scopeMessages;
	//		});

		};





	//-----------SEARCH---------------//

		$scope.search = {
			input: "",
			movieResults: [],
			peopleResults: [],
			submit: function() {
				console.log('Search ' + this.input);
				dataService.getPeopleResults(this.input, function(response){
					var success = response.data.Response;
					if (success) {
						$scope.search.peopleResults.splice(0,$scope.search.peopleResults.length);
						var peopleResults = response.data.Search;
						angular.forEach(peopleResults, function(person) {
							var person = person;
							$scope.search.peopleResults.push(person);
						});
					} else {
						console.log('Sorry, your search did not return a response.');
					};
				});
			}
		};

	});

/***/ }
]);