var request = require ("request");
var redis = require ("redis");
var async = require("async");
var emitter = require("events").EventEmitter;
var util = require("util");
var self = {};

if (process.env.REDISTOGO_URL) {
	var rtg = require('url').parse(process.env.REDISTOGO_URL);
	var client = redis.createClient(rtg.port, rtg.hostname);

	redis.auth(rtg.auth.split(':')[1]);
} else {
	var client = redis.createClient();
}


var RedditHandler = function(callback) {
	// ensure singleton
	if (self instanceof RedditHandler) {
		return self;
	};

	if (!(this instanceof RedditHandler)) {
		return new RedditHandler(callback);
	};

	emitter.call(this);
	this.subreddits = [];
	this.startTime = {};
	this.poll = process.env.REDDIT_POLL_FREQUENCY || 3;
	this.poll *= 1000;
	this.callback = typeof(callback) === typeof(Function) ? callback : undefined;
	self = this;
	

	// get subreddits that we're interested in from redis
	var getSubreddits = function(err,items) {
		if (err) {
			return redisErrorHandler("Failed to fetch subreddits: ", err);
		};

		client.HGETALL('last.update', function addToQueue (err, resp) {
			if (err) {
				return redisErrorHandler("Failed to fetch most recent update times: ", err);
			};
			self.subreddits = resp;
		})

		items.forEach(function(sub) { 
			request('http://www.reddit.com/r/'+sub+'/new.json?sort=new', processResponse);
		});
		return;
	}

	// process the response from reddit or pass along err to callback
	var processResponse = function(err,resp,body){
		if (err) {
			return self.callback(err);
		}
		if (resp.statusCode !== 200) {
			return;		//just skip for now.
		};

		var newSubmissions = JSON.parse(body);
		newSubmissions = newSubmissions.data.children;
		var subreddit = newSubmissions[0].data.subreddit.toLowerCase();
		self.startTime[subreddit] = Math.floor(Date.now() / 1000);

		var lastUpdate = {};
		if (self.subreddits) {
			lastUpdate = self.subreddits[subreddit];
		}

		if(isNaN(lastUpdate) || lastUpdate === undefined){
			lastUpdate = self.startTime[subreddit] - 86400 // 24 hours in seconds
			updateLastUpdate(subreddit,lastUpdate);
		}

		var len = newSubmissions.length;

		for(var i = 0; i < len; i++) {
			processSubmission(newSubmissions[i].data, lastUpdate)
		}
		
		// should be safe to always update the time here
		// may want to grab the timestamp from the most 
		// recent submission to ensure that we don't miss any. TODO?

		if (process.env.NODE_ENV === 'production') {
			updateLastUpdate(subreddit, self.startTime[subreddit]);
		};
		
		return;
	}

	// takes one submission and determines whether to add it to queue or skip it
	var processSubmission = function(submission, lastUpdate) {
		var task = {};
		if (submission.created_utc < lastUpdate) {
			return;
		};
		task.title = submission.title;
		task.url = submission.permalink;
		task.thumb = submission.thumbnail;
		task.submission = submission;
		
		self.emit('taskAdded', task);
		
		return;
	}

	// update the last update hash in redis
	var updateLastUpdate = function (subreddit,newTime) {
		client.HSET('last.update',subreddit,newTime, function updateError (err, resp) {
			if (err) {
				return redisErrorHandler('Failed to set update time for: ', err);
			};
			return;
		})
	}

	// handle all redis errors through this method that will call the error callback
	var redisErrorHandler = function (msg, err) {
		self.error.redisError += 1;
		// regardless of whether we've exceeded max
		// clear the timer or it keeps going.
		clearInterval(self.timer); 
		return self.callback(msg + err);
		
	}

	// "public" method to start the timer and kick off the querying
	this.start = function() {
		this.timer = setInterval(function() {
			client.LRANGE("subreddits", 0, -1, getSubreddits);
		}, this.poll);
		return;
	}

	// "public" method to gracefully disconnect and shutdown
	this.shutdown = function (callback) {
		console.log("Requested shutdown.");
		clearInterval(this.timer);
		client.quit();
		return typeof(callback) === typeof(Function) ? callback() : null;
	}

	// "public" method to add a subreddit from redis
	this.addSubreddit = function(subreddit){
		if (self.subreddits[subreddit]) {
			return;
		};
		client.RPUSH('subreddits',subreddit,function subredditAdded (err,resp) {
			if (err) {
				redisErrorHandler("Failed to add subreddit: ", err);
			};
		})
	}

	// "public" method to remove a subreddit from redis
	this.remSubreddit = function(subreddit){
		if (!self.subreddits[subreddit]) {
			return;
		};
		client.LREM('subreddits',0,subreddit,function subredditAdded (err,resp) {
			if (err) {
				redisErrorHandler("Failed to remove subreddit: ", err);
			};
		})
	}

	return this;
}

util.inherits(RedditHandler,emitter);
exports = module.exports = RedditHandler;
