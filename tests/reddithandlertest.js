var RedditHandler = require('../src/reddithandler.js');
var rHandler = new RedditHandler();
var counter = 0;

rHandler.on('start', function startCallback () {
	console.log('started');
});

rHandler.on('added', function addedCallback (subreddit, resp) {
	console.log('Added: ' + subreddit + '\t' + resp);
	setTimeout(rHandler.remSubreddit.bind(rHandler), 15000, subreddit);
});

rHandler.on('removed', function removedCallback (subreddit, resp) {
	console.log('Removed: ' + subreddit + '\t' + resp);
});
rHandler.on('new', function newCallback (post) {
	counter++;
	if(counter % 10 === 0){
		console.log('Found: ' + post.subreddit + '\t' + post.name);
	}
});
rHandler.on('error', function errorCallback (err) {
	console.log('OH NOES!!!');
	console.log(err);
});

rHandler.start();
setTimeout(rHandler.addSubreddit.bind(rHandler), 5000, 'modestmouse');