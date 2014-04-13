var RedditHandler = require('../lib/reddithandler.js');
var rHandler = new RedditHandler();
var counter = 0;

rHandler.on('start', function startCallback () {
	console.log('started successfully');
});

rHandler.on('keyword', function keywordCallback (keyword, isAdd, resp) {
	var str = isAdd ? 'Added' : 'Removed';
	console.log(str,'keyword:', keyword);
	if (isAdd) {
		rHandler.remKeyword(keyword);
	}

});

rHandler.on('subreddit', function subredditCallback (subreddit, isAdd, resp) {
	var str = isAdd ? 'Added' : 'Removed';
	console.log(str, 'subreddit:', subreddit, '\t', resp);
	if(isAdd){
		rHandler.addKeyword('BALLS!!!');
		setTimeout(rHandler.remSubreddit.bind(rHandler), 15000, subreddit);
	} else {
		rHandler.forceError('forced error');
	}
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