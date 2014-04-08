var request = require ("request");
var redis = require ("redis")
var client = redis.createClient();
var async = require("async");
var emitter = require("events").EventEmitter;
var util = require("util");
var myself = {};
var workQueue = [];

var RedditHandler = function(queue,poll) {
	emitter.call(this);
	this.subreddits = [];
	this.polltime = poll * 1000;
	workQueue = queue;
	myself = this;


	var getSubreddits = function(err,items) {
		console.log('getting subreddits');
		if (err) {throw error;};
		client.HGETALL('last.update', function addToQueue (err, resp) {
			if (err) {throw err;};
			subreddits = resp;
		})

		items.forEach(getSubmissions);
	}

	var getSubmissions = function(sub) { 
		request('http://www.reddit.com/r/'+sub+'/new.json?sort=new', processResponse);
	}

	var processResponse = function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			var newSubmissions = JSON.parse(body);
			newSubmissions = newSubmissions.data.children;
			var subreddit = newSubmissions[0].data.subreddit.toLowerCase();
			var lastUpdate = subreddits[subreddit];
			console.log(lastUpdate);
			var len = newSubmissions.length;

			for(var i = 0; i < len; i++) {
				processSubmission(newSubmissions[i].data, lastUpdate)
			}
		}
	}

	var processSubmission = function(submission,lastUpdate) {
		var tempObject = {};
		if (submission.created_utc < lastUpdate) {
			return;
		};
		tempObject.title = submission.title;
		tempObject.url = submission.permalink;
		tempObject.thumb = submission.thumbnail;
		workQueue.push(tempObject);
		myself.emit('taskAdded', tempObject, submission);
	}

	this.start = function() {
		console.log(this.polltime);
		setInterval(function() {
			client.LRANGE("subreddits", 0, -1, getSubreddits);
		}, this.polltime);
	}

}

util.inherits(RedditHandler,emitter);
exports = module.exports = RedditHandler;
