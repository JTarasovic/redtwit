var config = require('../config');
var twitterAPI = require('node-twitter-api');
var twitter = new twitterAPI(config.twitter);
var accTok = config.twitter.accessToken;
var accTokSec = config.twitter.accessTokenSecret;
var redditUrl = 'http://www.reddit.com';

var TwitterHandler = function (options) {
	this.lat = 39.828127;
	this.lng = -98.579404;
	this.place_id = '93e191cd736864c0';
	this.coord = true;
	this.trim = true;
	this.len = 25;

	this.post = function (title, url, callback) {
		if (title.length > (140 - this.len)) {
			title = title.substring(0, (140 - len - 10)) + '...';
		};

		var fullStatus = title + ' ' + redditUrl + url;

		twitter.statuses('update',{
			status: fullStatus,
			lat: this.lat,
			long: this.lng,
			place_id: this.place,
			display_coordinates: this.coord,
			trim_user: this.trim
		},
		accTok,
		accTokSec,
		function afterUpdate (err, data, resp) {
			callback(err,data,resp);			
		});
	}

	this.messages = function (dataCallback, endCallback) {
		twitter.getStream('user',{} ,accTok ,accTokSec
			,dataCallback
			,endCallback)
	}
	var updateLinkLength = function () {
		twitter.help('configuration', {}, accTok, accTokSec, function (err,data,resp) {
			if (data['short_url_length']) {
				this.len = data['short_url_length'];
			};
		});
	}

	updateLinkLength();
	return this;

}

exports = module.exports = TwitterHandler;
