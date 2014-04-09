var date = new Date();
var queue = [];


var RedditHandler = require("./reddithandler");
var rHandler = new RedditHandler({
	poll: 3,
	callback: function errorHandler (err) {
		console.log(err);
	}
});

var TwitterHandler = require("./twitterhandler");
var tHandler = new TwitterHandler();

var close = function () {
	rHandler.shutdown(function shutdown () {
		process.exit();
	})
}

rHandler.on('taskAdded',function letsDoThis (task) {
	console.dir(task.thumb);
})

process.on('SIGTERM', close).on('SIGINT', close);

console.log("Starting " + date.toString());
rHandler.start();


