var request = require ("request");
var redis = require ("redis")
var client = redis.createClient();
var async = require("async");
var emitter = require("events").EventEmitter;
var util = require("util");
var myself = {};
//var workQueue = [];

var RedditHandler = function(options) {
	// ensure singleton
	if (myself instanceof RedditHandler) {
		return myself;
	};
	emitter.call(this);
	this.subreddits = [];
	this.workQueue = options.queue;
	this.poll = options.poll * 1000;
	myself = this;


	var getSubreddits = function(err,items) {
		console.log('getting subreddits');
		if (err) {throw error;};
		client.HGETALL('last.update', function addToQueue (err, resp) {
			if (err) {throw err;};
			myself.subreddits = resp;
		})

		items.forEach(function(sub) { 
			request('http://www.reddit.com/r/'+sub+'/new.json?sort=new', processResponse);
		});
		return;
	}

	var processResponse = function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			var newSubmissions = JSON.parse(body);
			newSubmissions = newSubmissions.data.children;
			var subreddit = newSubmissions[0].data.subreddit.toLowerCase();
			var lastUpdate = myself.subreddits[subreddit];
			console.log(lastUpdate);
			var len = newSubmissions.length;

			for(var i = 0; i < len; i++) {
				processSubmission(newSubmissions[i].data, lastUpdate)
			}
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
		myself.workQueue.push(task);
		myself.emit('taskAdded', task, submission);
		return;
	}

	this.start = function() {
		setInterval(function() {
			client.LRANGE("subreddits", 0, -1, getSubreddits);
		}, this.poll);
		return;
	}

}

util.inherits(RedditHandler,emitter);
exports = module.exports = RedditHandler;
