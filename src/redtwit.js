var request = require ("request");
var redis = require ("redis");
var client = redis.createClient();
var log = require("console").log;

var ts = Date.now() / 1000;
var offset = 90*60;
ts = ts - offset;

getSubreddits = function(err,items) {
	if (err) {throw error;};
	items.forEach(getNewSubmissions);
}

getNewSubmissions = function(sub) {
	request('http://www.reddit.com/r/'+sub+'/new.json?sort=new', processSubmissions);
}

processSubmissions = function(err,resp,body){
	if (!err && resp.statusCode == 200) {
		var newSubmissions = JSON.parse(body);
		newSubmissions = newSubmissions.data.children;
		
		if (newSubmissions[0].data.subreddit) {
			checkTime(newSubmissions[0].data.subreddit)
		};

		for(var i=0; i < newSubmissions.length; i++) {
			if (newSubmissions[i].data.created_utc > ts) {
				log(newSubmissions[i].data.title + "\n");
			};
		}
	}
};

checkTime = function(sub) {
	sub = sub.toLowerCase();
	var query = sub + ':last.update';
	log(query);
	client.get(query,redis.print);
}



client.LRANGE("subreddits", 0, -1, getSubreddits);

client.quit();
