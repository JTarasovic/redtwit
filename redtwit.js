var express = require('express');
var port = process.env.PORT || 5000;
var app = express();
var keywords;


var RedditHandler = require("./lib/reddithandler");
var rHandler = new RedditHandler();

var TwitterHandler = require("./lib/twitterhandler");
var tHandler = new TwitterHandler();

function onStart () {
	tHandler.dm('Starting...', 'J_Tarasovic');
}

function onDM (dm, resp){
	if (dm === null) return;

	var msg = dm.direct_message.text.toLowerCase();
	if (msg.indexOf('sub ') === 0){
		rHandler.addSubreddit(msg.substring(4,msg.length));
		console.log('Adding subreddit: ', msg.substring(4,msg.length));
		return;
	}
	if (msg.indexOf('unsub ') === 0 ) {
		rHandler.remSubreddit(msg.substring(6,msg.length));
		console.log('Removing subreddit: ', msg.substring(6,msg.length));
		return;
	}
	if (msg.indexOf('keyword ') === 0) {
		rHandler.addKeyword(msg.substring(8,msg.length));
		console.log('Adding keyword: ', msg.substring(8,msg.length));
		return;
	}
	if (msg.indexOf('unkeyword ') === 0) {
		rHandler.remKeyword(msg.substring(10, msg.length));
		console.log('Removing keyword: ', msg.substring(10,msg.length));
		return;
	}
	if (isLikeFollowing(msg)) {
		if (rHandler.subreddits && (rHandler.subreddits instanceof Array)) {
			var subreddits = rHandler.subreddits.join(', ');
			subreddits = formatFollowing(subreddits);
			tHandler.post(subreddits);
		}
		return;
	}

	var oops = 'Sorry, I don\'t understand that.';
	tHandler.dm(oops, dm.direct_message.sender_screen_name);
}

function isLikeFollowing (msg) {
	switch(msg){
		case 'following ':
		case 'follow ':
			return true;
		case 'watching ':
		case 'watch ':
			return true;
		default:
			return false;
	}
}

function formatFollowing (subreddits) {
	if (subreddits.length > 120) {
		subreddits = subreddits.substr(0, 120) + '...' ;
	}
	return 'I am following ' + subreddits;
}

function onSubreddit (subreddit, isAdd, resp) {
	var str = isAdd ? 'I am now' : 'I am no longer';
	tHandler.post(str + ' watching ' + subreddit);
	console.log(str + ' subreddit:', subreddit);
}

function onKeyword (keyword, isAdd, resp) {
	var str = isAdd ? 'Added' : 'Removed';
	console.log(str + ' keyword:', keyword);
}

function onNew (post, resp) {
	var text = formatPost(post);
	tHandler.post(text);
}

function formatPost (post) {
	var tweetMax = (140 - tHandler.length) - 5;
	var text = post.title.substring(0, tweetMax).addHashTags(rHandler.keywords);
	text = text + ' ' + post.url;
	console.log(text);
	console.log(text.length);
	return text;
}

function onClose (err,end,data) {
	tHandler.dm('Shutting down...', 'J_Tarasovic');
	rHandler.shutdown(function shutdown () {
		process.exit();
	});
}

function onError (err) {
	console.error(err);
}

String.prototype.addHashTags = function (keywords){
	if (keywords.length === 0) return this.toString();
	var str = this.toString();
	for(var i=0; i < keywords.length; i++){
		str = str.replace(new RegExp('\\b' + keywords[i] + '\\b','gi'), '#$&');
	}
	return str;
};


// ***REDDIT_LISTENERS***
rHandler.on('start', onStart);
rHandler.on('new', onNew);
rHandler.on('keyword', onKeyword);
rHandler.on('subreddit', onSubreddit);
rHandler.on('error', onError);



app.listen(port);
app.get('*',function (req, res) {
	res.sendfile('./public/index.html');
});


tHandler.on('newDM', onDM);
tHandler.on('error', onError);
tHandler.startUserStream();



process.on('SIGTERM', onClose)
.on('SIGINT', onClose);

console.log("Redtwit Bot starting.");

rHandler.start();
