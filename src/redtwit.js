var request = require ("request");
var redis = require ("redis")
var client = redis.createClient();
var async = require("async");
var inspect = require("util").inspect;
var log = require("console").log;


var subreddits = [];
var workQueue = [];



getSubreddits = function(err,items) {
	if (err) {throw error;};
	client.HGETALL('last.update', function addToQueue (err, resp) {
		if (err) {throw err;};
		subreddits = resp;
	})

	items.forEach(getSubmissions);
}

getSubmissions = function(sub) { 
	request('http://www.reddit.com/r/'+sub+'/new.json?sort=new', processResponse);
}

processResponse = function(err,resp,body){
	if (!err && resp.statusCode == 200) {
		var newSubmissions = JSON.parse(body);
		newSubmissions = newSubmissions.data.children;
		var subreddit = newSubmissions[0].data.subreddit.toLowerCase();
		var lastUpdate = subreddits[subreddit];
		var len = newSubmissions.length;

		for(var i = 0; i < len; i++) {
			processSubmission(newSubmissions[i].data, lastUpdate)
		}
	}
}

processSubmission = function(submission,lastUpdate) {
	var tempObject = {};
	if (submission.created_utc < lastUpdate) {
		return;
	};
	
	tempObject.title = submission.title;
	tempObject.url = submission.permalink;
	tempObject.thumb = submission.thumbnail;
	workQueue.push(tempObject);
}

getUpdateTimes = function(element, index, arr){
	client.get(element, function addToArray (err, resp) {
		if (err) {throw err;};
		if (subreddits.hasOwnProperty(element)) {};
		updateArray.push(resp);
	})
}

var process = function(task){
	log(inspect(task));
}

setInterval(function start () {
	client.LRANGE("subreddits", 0, -1, getSubreddits);
}, 3000);

setInterval(function something () {
	if (workQueue.length > 0) {
		process(workQueue.shift());
	};
}, 10);
