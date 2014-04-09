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

var close = function (err,end,data) {
	rHandler.shutdown(function shutdown () {
		process.exit();
	})
}

rHandler.on('taskAdded',function letsDoThis (task) {
/*	tHandler.post(task.title, task.url, function cb (err,data,resp) {
		if (err) {
			console.log(err);
		};
	});*/
})

var dataHandler = function (err, data, resp) {
	if (data === null) {
		return;
	}
	var msg = data.direct_message.text.toLowerCase();
	if (msg.indexOf('sub') === 0 
		|| msg.indexOf('unsub') === 0 ) {
		console.log(msg);
	}
}

tHandler.messages(dataHandler, close);

process.on('SIGTERM', close).on('SIGINT', close);

console.log("Starting " + date.toString());
rHandler.start();


