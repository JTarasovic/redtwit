var request = require ("request");
var redis = require ("redis")
var client = redis.createClient();
var async = require("async");
var ins = require("util").inspect;
var date = new Date();

var queue = [];

var RedditHandler = require("./reddithandler");
var rHandler = new RedditHandler({
	poll: 3,
	callback: function errorHandler (err) {
		console.log(err);
	}
});

var close = function () {
	rHandler.shutdown(function shutdown () {
		process.exit();
	})
}

rHandler.on('taskAdded',function letsDoThis (task, submission) {
	console.dir(task);
})

process.on('SIGTERM', close).on('SIGINT', close);

console.log("Starting " + date.toString());
rHandler.start();


