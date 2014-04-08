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
	this.poll = options.poll !== undefined ? options.poll * 1000 : 10000;
	this.max_retries = options.max_retries !== undefined ? max_retries : 5;
	this.callback = typeof(options.callback) === typeof(Function) ? options.callback : undefined;
	this.errors = {};
	self = this;


	var getSubreddits = function(err,items) {
		console.log('getting subreddits');
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

	var processResponse = function(err,resp,body){
		if (err || resp.statusCode !== 200) {
			return self.callback(err);
		}

		var newSubmissions = JSON.parse(body);
		newSubmissions = newSubmissions.data.children;
		var subreddit = newSubmissions[0].data.subreddit.toLowerCase();
		var lastUpdate = self.subreddits[subreddit];

		if(isNaN(lastUpdate) || lastUpdate === undefined){
			//INSERT REDIS UPDATE HERE!!

			lastUpdate = ( Date.getTime / 1000 ) - 86400 // 24 hours in seconds
		}

		var len = newSubmissions.length;

		for(var i = 0; i < len; i++) {
			processSubmission(newSubmissions[i].data, lastUpdate)
		}
		
		return;
	}

	var processSubmission = function(submission,lastUpdate) {
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

	this.start = function() {
		this.timer = setInterval(function() {
			client.LRANGE("subreddits", 0, -1, getSubreddits);
		}, this.poll);
		console.log(util.inspect(this.timer));
		return;
	}

	var redisErrorHandler = function (msg, err) {
		self.error.redisError += 1;
		// regardless of whether we've exceeded max
		// clear the timer or it keeps going.
		clearInterval(self.timer); 
		if (self.error.redisError > max_retries) {
			return self.callback(msg + err);
		};
		self.poll += self.poll;
		self.start();
	}
}

util.inherits(RedditHandler,emitter);
exports = module.exports = RedditHandler;
