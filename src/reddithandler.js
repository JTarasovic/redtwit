var request = require ("request");
var redis = require ("redis");
var client = redis.createClient();
var async = require("async");
var emitter = require("events").EventEmitter;
var util = require("util");
var self = {};

var RedditHandler = function(options) {
	// ensure singleton
	if (self instanceof RedditHandler) {
		return self;
	};
	emitter.call(this);
	this.subreddits = [];
	this.workQueue = options.queue !== undefined ? options.queue : [];
	this.startTime = {};
	this.poll = options.poll !== undefined ? options.poll * 1000 : 10000;
	this.max_retries = options.max_retries !== undefined ? max_retries : 5;
	this.callback = typeof(options.callback) === typeof(Function) ? options.callback : undefined;
	this.errors = {};
	self = this;


	// get subreddits that we're interested in from redis
	var getSubreddits = function(err,items) {
		if (err) {
			return redisErrorHandler("Exceeded max_retries: ", err);
		};

		client.HGETALL('last.update', function addToQueue (err, resp) {
			if (err) {
				return redisErrorHandler("Failed to retrieve most recent update times: ", err);
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
		if (err || resp.statusCode !== 200) {
			return self.callback(err);
		}

		var newSubmissions = JSON.parse(body);
		newSubmissions = newSubmissions.data.children;
		var subreddit = newSubmissions[0].data.subreddit.toLowerCase();
		self.startTime[subreddit] = Math.floor(Date.now() / 1000);
		var lastUpdate = self.subreddits[subreddit];

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
		updateLastUpdate(subreddit, self.startTime[subreddit]);

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
		
		self.workQueue.push(task);
		self.emit('taskAdded', task, submission);
		
		return;
	}

	// "public" method to start the timer and kick off the querying
	this.start = function() {
		this.timer = setInterval(function() {
			client.LRANGE("subreddits", 0, -1, getSubreddits);
		}, this.poll);
		return;
	}

	// update the last update hash in redis
	var updateLastUpdate = function (subreddit,newTime) {
		client.HSET('last.update',subreddit,newTime, function updateError (err, resp) {
			if (err) {
				return redisErrorHandler('Failed to set update time for: ', err);
			};
			console.log(resp);
			return;
		})
	}

	// handle all redis errors through this method that will call the error callback
	var redisErrorHandler = function (msg, err) {
		self.error.redisError += 1;
		// regardless of whether we've exceeded max
		// clear the timer or it keeps going.
		clearInterval(self.timer); 
		if (self.error.redisError > max_retries) {
			return self.callback(msg + err);
		};
		self.start();
	}
}

util.inherits(RedditHandler,emitter);
exports = module.exports = RedditHandler;
