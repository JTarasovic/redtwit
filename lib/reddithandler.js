var util = require("util");
var emitter = require("events").EventEmitter;
var redis = require ("redis");
var ONE_SECOND = 1000;				// 1000 milliseconds
var ONE_HOUR = 60 * 60; 			// 3600 seconds
var ONE_DAY = 24 * ONE_HOUR;		// 86400 seconds

var RedditHandler = function() {
	if (!(this instanceof RedditHandler)) {
		return new RedditHandler();
	}

	emitter.call(this);
	this._request = require ("request");
	this._baseUrl = 'http://www.reddit.com/r/';
	this._date = new Date();
	this._client = {};
	this._redditSort = process.env.REDDIT_SORT || 'new';
	this.poll = process.env.REDDIT_POLL_FREQUENCY || 3;
	this.offset = process.env.REDDIT_DEFAULT_HOURS || 6;
	this.poll *= ONE_SECOND;
	this.offset *= ONE_HOUR;	// 60 min * 60 sec in an hour
	this.subreddits = [];

	if (process.env.REDISTOGO_URL) {
		var rtg = require('url').parse(process.env.REDISTOGO_URL);
		this._client = redis.createClient(rtg.port, rtg.hostname);

		this._client.auth(rtg.auth.split(':')[1]);
	} else {
		this._client = redis.createClient();
	}

	this._queryUrl = '/' + this._redditSort +'.json?sort=' + this._redditSort;

	

	return this;
};

RedditHandler.prototype = Object.create(emitter.prototype);


// "public" method to start the timer and kick off the querying
RedditHandler.prototype.start = function (callback) {
	console.log('RedditHandler starting');
	this._timer = setInterval(this._start.bind(this), this.poll);
	this.emit('start');
	return typeof(callback) === typeof(Function) ? callback() : null;
};

// "public" method to gracefully disconnect and shutdown
RedditHandler.prototype.shutdown = function (callback) {
	console.log("RedditHandler shutting down.");
	clearInterval(this._timer);
	this._client.quit();
	this.emit('shutdown');
	return typeof(callback) === typeof(Function) ? callback() : null;
};

// "public" method to add a subreddit from redis
RedditHandler.prototype.addSubreddit = function(subreddit){
	if (this.subreddits.indexOf(subreddit) > -1) {
		return;
	}
	this._client.LPUSH(
		'subreddits',
		subreddit,
		this._addSubreddit.bind(this, subreddit)
		);
	return;
};

// "public" method to remove a subreddit from redis
RedditHandler.prototype.remSubreddit = function(subreddit){
	if (this.subreddits.indexOf(subreddit) < 0) {
		return;
	}
	this._client.LREM(
		'subreddits',
		0,
		subreddit,
		this._removeSubreddit.bind(this, subreddit)
		);
};

RedditHandler.prototype.forceError = function (err) {
	this.emit('error', err);
};

// start by getting the list of subreddits
RedditHandler.prototype._start = function() {
	this._client.LRANGE("subreddits", 0, -1, this._querySubreddits.bind(this));
	return;
};

// get subreddits that we're interested in from redis
RedditHandler.prototype._querySubreddits = function (err,subreddits) {
	if (err) {
		this.emit('error',err);
		return;
	}
	this.subreddits = subreddits;
	subreddits.forEach(this._doQuery.bind(this));
	return;
};

// request the submissions from reddit
RedditHandler.prototype._doQuery = function (subreddit) {
	var updateURL = this._baseUrl + subreddit + this._queryUrl;
	this._request(updateURL, this._processResponse.bind(this, subreddit));
};

// process the response from reddit or pass along err to callback
RedditHandler.prototype._processResponse = function (subreddit, err, resp, body){
	
	if (err) {
		this.emit('error',err);
		return;
	}
	if (resp.statusCode !== 200) {
		return;		//just skip for now.
	}

	var newSub = JSON.parse(body);
	newSub = newSub.data.children;

	var len = newSub.length;
	for (var i = 0; i < len; i++) {
		this._querySubmission.call(this, subreddit, newSub[i].data);
	}

	return;
};

// takes one submission and queries redis to make sure we haven't already seen it
RedditHandler.prototype._querySubmission = function (subreddit, submission) {
	this._client.GET(
		submission.name, 
		this._checkSubmission.bind(this, subreddit, submission)
		);
	return;
};

// takes one submission and determines whether to it is new
RedditHandler.prototype._checkSubmission = function (subreddit, submission, err, resp) {
	if (err) {
		this.emit('error', err);
		return;
	}

	// not previously seen (or no longer in cache?)
	if (resp === null) {
		this._processSubmission.call(this, subreddit, submission);
	}
	return;
};

// turns the raw submission into a post 
RedditHandler.prototype._processSubmission = function (subreddit, submission) {
	var post = {};
	post.title = submission.title;
	post.name = submission.name;
	post.permalink = submission.permalink;
	post.thumbnail = submission.thumbnail;
	post.is_self = submission.is_self;
	post.created_utc = submission.created_utc;
	post.url = submission.url;
	post.subreddit = subreddit;
	
	this._client.SETEX(
		submission.name,
		ONE_DAY,
		1,
		this._updateRedis.bind(this, post)
		);

	return;	
};

// redis has been updated with the post
RedditHandler.prototype._updateRedis = function (post, err, resp) {
	if (err) {
		this.emit('error', err);
		return;
	}

	var now = Math.floor(this._date.getTime() / 1000);

	if (post.created_utc < (now - this.offset)) {
			return;			// quit early. don't actually emit new.
		}

		this.emit('new', post, resp);
	};

// push a subreddit onto the list of subreddits
RedditHandler.prototype._addSubreddit = function (subreddit, err, resp) {
	if (err) {
		this.emit('error', err);
		return;
	}
	this.subreddits.push(subreddit);
	this.emit('added', subreddit, resp);
	return;
};

// remove a subreddit from the list of subreddits
RedditHandler.prototype._removeSubreddit = function (subreddit, err, resp) {
	if (err) {
		this.emit('error', err);
		return;
	}
	this.emit('removed', subreddit, resp);
	return;
};

exports = module.exports = RedditHandler;
