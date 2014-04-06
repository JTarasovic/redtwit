var request = require ("request");
var redis = require ("redis");
var client = redis.createClient();
var log = require("console").log;

var ts = Date.now() / 1000;
var offset = 90*60;
ts = ts - offset;
var subreddits = ["android", "cypherpunks", "linux"];


processSubmissions = function(err,resp,body){
	if (!err && resp.statusCode == 200) {
		var newSubmissions = JSON.parse(body);
		newSubmissions = newSubmissions.data.children;
		
		for(var i=0; i < newSubmissions.length; i++) {
			if (newSubmissions[i].data.created_utc > ts) {
				log(newSubmissions[i].data.title + "\n");
			};
		}
	}
};

getNewSubmissions = function(sub) {
	request('http://www.reddit.com/r/'+sub+'/new.json?sort=new', processSubmissions})
}

client.LRANGE(0,-1,redis.print);

//subreddits.forEach(getNewSubmissions);