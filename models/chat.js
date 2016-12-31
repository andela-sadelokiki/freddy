'use strict';

var mongoose = require('mongoose');
var ChatSchema = new mongoose.Schema({
	group: {
		type: Boolean,
		required: true
	},
	users: {
		type: Array,
		required: true
	},
	messages: {
		type: Array
	},
	name: {
		type: String,
		trim: true,
		required: false
	}
});

var Chat = mongoose.model('Chat', ChatSchema);
module.exports = Chat;