var config = require('../config');
var twitterAPI = require('node-twitter-api');
var twitter = new twitterAPI(config.twitter);
var accTok = config.twitter.accessToken;
var accTokSec = config.twitter.accessTokenSecret;


twitter.verifyCredentials(accTok, accTokSec,function test (err, data, resp) {
		if (err) {
			return console.log(err);
		};
	});

twitter.statuses("update", {
	status: "Test!"
	},
	accTok,
	accTokSec,
	function didWePost (err, data, resp) {
		if (err) {
			return console.log(err);
		};

		console.dir(data);
	}
)