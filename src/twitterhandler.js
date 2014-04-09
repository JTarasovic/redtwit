var config = require('../config');
var twitterAPI = require('node-twitter-api');
var twitter = new twitterAPI(config.twitter);
var accTok = config.twitter.accessToken;
var accTokSec = config.twitter.accessTokenSecret;


/*twitter.verifyCredentials(accTok, accTokSec,function test (err, data, resp) {
		if (err) {
			return console.log(err);
		};
	});*/

var TwitterHandler = function (options) {
	this.lat = 39.828127;
	this.lng = -98.579404;
	this.place_id = '93e191cd736864c0';
	this.coord = true;
	this.trim = true;

	this.post = function (update, callback) {
		twitter.statuses('update',{
			status: update,
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

	return this;

}

exports = module.exports = TwitterHandler;





/*twitter.geo('reverse_geocode', param, accTok,accTokSec,function stuff (err,data,resp) {
	console.log(ins(data.result.places));
})*/

/*twitter.statuses('update', {
		status: task.title.substring(0,100) + "\n" + task.thumb
		},
		accTok, 
		accTokSec,
		function gotResponse (err,data,resp) {
			if (err) {console.log(err)};
			console.dir(data);
		})*/

/*twitter.statuses("update", {
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
)*/