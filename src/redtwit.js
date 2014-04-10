var date = new Date();
var queue = [];
var express = require('express');
var port = process.env.PORT || 5000;
var app = express();
 
app.listen(port);
app.get('*',function (req, res) {
	res.sendfile('./public/index.html');
});


var RedditHandler = require("./reddithandler");
var rHandler = new RedditHandler(function errorHandler (err) {
		if (err) {
			console.log(err);	// do something with this.
		};
});

var TwitterHandler = require("./twitterhandler");
var tHandler = new TwitterHandler();

var close = function (err,end,data) {
	rHandler.shutdown(function shutdown () {
		process.exit();
	})
}

// rHandler.on('taskAdded',postToTwitter);

var postToTwitter = function (task) {
	tHandler.post(task.title, task.url, function cb (err,data,resp) {
		if (err) {
			console.log(err);
		};
	});
}

var dataHandler = function (err, data, resp) {
	if (data === null) {
		return;
	}
	var msg = data.direct_message.text.toLowerCase();
	if (msg.indexOf('sub') === 0){
		rHandler.addSubreddit(msg.substring(4,msg.length));
		console.log(msg.substring(4,msg.length))
	}
	if (msg.indexOf('unsub') === 0 ) {
		rHandler.remSubreddit(msg.substring(6,msg.length));
		console.log(msg.substring(6,msg.length))
	}
}

tHandler.messages(dataHandler, close);

process.on('SIGTERM', close).on('SIGINT', close);

console.log("Starting: " + date.toString());
rHandler.start();
