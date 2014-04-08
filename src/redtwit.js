var request = require ("request");
var redis = require ("redis")
var client = redis.createClient();
var async = require("async");
var ins = require("util").inspect;

var queue = [];

var RedditHandler = require("./reddithandler");
var rHandler = new RedditHandler({
	queue: [],
	poll: 3
});

rHandler.on('taskAdded',function doShit () {
	queue.shift();
})

console.log("ready to start");
rHandler.start();



