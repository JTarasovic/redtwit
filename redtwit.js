var date = new Date();
var queue = [];
var express = require('express');
var port = process.env.PORT || 5000;
var app = express();
 
var RedditHandler = require("./lib/reddithandler");
var rHandler = new RedditHandler();

var TwitterHandler = require("./lib/twitterhandler");
var tHandler = new TwitterHandler();

var close = function (err,end,data) {
	rHandler.shutdown(function shutdown () {
		process.exit();
	})
}

var postToTwitter = function (post, resp) {
	tHandler.post(post.title, post.permalink, function cb (err,data,resp) {
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

app.listen(port);
app.get('*',function (req, res) {
	res.sendfile('./public/index.html');
});

rHandler.on('new',postToTwitter);
// rHandler.on('added',);
// rHandler.on('removed');
// rHandler.on('error', )

tHandler.messages(dataHandler, close);

process.on('SIGTERM', close)
		.on('SIGINT', close);

console.log("Redtwit Bot starting.");

rHandler.start();
