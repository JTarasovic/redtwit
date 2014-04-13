var RedditHandler = require('../lib/reddithandler.js');
var rHandler = new RedditHandler();
var counter = 0;

rHandler.on('start', function startCallback () {
	console.log('started successfully');
});

rHandler.on('keywords', function keywordsCallback (arr) {
	console.log('%d keywords received', arr.length);
});

rHandler.on('added', function addedCallback (subreddit, resp) {
	console.log('Added: ' + subreddit + '\t' + resp);
	setTimeout(rHandler.remSubreddit.bind(rHandler), 15000, subreddit);
});

rHandler.on('removed', function removedCallback (subreddit, resp) {
	console.log('Removed: ' + subreddit + '\t' + resp);
	rHandler.forceError('forced error');
});

rHandler.on('new', function newCallback (post) {
	console.log('Found: ' + post.subreddit + '\t' + post.name);
});

rHandler.on('error', function errorCallback (err) {
	console.log('OH NOES!!!');
	console.log(err);
	rHandler.shutdown();
});

rHandler.start();
setTimeout(rHandler.addSubreddit.bind(rHandler), 5000, 'modestmouse');