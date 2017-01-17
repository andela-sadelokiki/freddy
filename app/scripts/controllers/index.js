'use strict';

var angular = require('angular');

angular.module('freddyApp')
.controller('mainCtrl', function($scope, dataService, $q, $filter, $timeout, socket) {

	dataService.getUser(function(response) { 
    	console.log(response.data);
    	$scope.user = response.data;
    }, function(response) {
    	$scope.loadUserChats();
    });

  	socket.on('connect',function(){
			console.log('connected');
  	});

	$scope.loadUsersBasicArray = function(IDsArray){
		var usersArray = [];
	 	angular.forEach(IDsArray, function(id){
		 		dataService.getUsername(id, function(response){	
//		 			var list = loadUsernames(response.data);
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
		console.log('clicked');
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
				console.log("entered", response.data.message);
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