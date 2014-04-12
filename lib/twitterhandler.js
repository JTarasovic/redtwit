var util = require("util");
var emitter = require("events").EventEmitter;
var redditUrl = 'http://www.reddit.com';

var TwitterHandler = function (options) {
	if (!(this instanceof TwitterHandler)) {
		return new TwitterHandler(options);
	};

	emitter.call(this);
	this._twitterAPI = require('node-twitter-api');
	this._twitter = new this._twitterAPI({
		consumerKey: process.env.TWITTER_CON_KEY,
		consumerSecret: process.env.TWITTER_CON_SECRET,
		callback: null
	});


	this._accTokSec = process.env.TWITTER_ACC_SECRET;
	this._accTok = process.env.TWITTER_ACC_TOKEN;
	this._place_id = '93e191cd736864c0';
	this._coord = true;
	this._trim = true;
	this._screen_name = process.env.REDTWIT_TWITTER_NAME;
	this._lat = null;
	this._lng = null;
	this._len = 25;
	this._semaphore = false;

	this.post = function (text) {
		post = {
			status: text,
			lat: this._lat,
			long: this._lng,
			place_id: this._place_id,
			display_coordinates: this._coord,
			trim_user: this._trim
		}

		this._twitter.statuses(
			'update',
			post,
			this._accTok,
			this._accTokSec,
			_onPost.bind(this, post)
			);
	}

	this.startUserStream = function () {
		this._twitter.getStream(
			'user', 
			{}, 
			this._accTok, 
			this._accTokSec,
			_onData.bind(this),
			_onEnd.bind(this)
			);
	}

	function _queryConfiguration () {
		this._twitter.help(
			'configuration',
			{},
			this._accTok,
			this._accTokSec,
			_updateLinkLength.bind(this)	
			);
	}

	function _updateLinkLength (err, data, resp) {
		if (err) {
			this.emit('error', err);
			return;
		};

		if (data.short_url_length) {
			this._len = data.short_url_length;
		};

		this.emit('ready', data);
		return;
	}

	function _onData (err, data, resp) {
		if (err) {
			this.emit('error', err, resp);
			return;
		};
		this.emit('streamData', data, resp);
		if (data.direct_message) {
			this.emit('dm', data, resp);
			return;
		};

		if (data.event) {
			/*switch (data.event) {
				case follow:
					this.emit('followed', data, resp);
					break;
				case favorite:
					if (data.recipient.screen_name === this._screen_name) {
						this.emit('favorited', data, resp);
					}; 
					break;
			}*/
			console.error('\n\nTwitterHandler.js >_onData > ~106');
			console.error(util.inspect(data.event));
		};

		return;
	}

	function _onEnd (err, data, resp) {
		if (err) {
			this.emit('error', err, resp);
			return;
		};

		// TODO: do some parsing and emit more granular messages
		this.emit('streamEnd', data, resp);
		return; 
	}

	function _onPost (post, err, data, resp) {
		if (err) {
			this.emit('error', err, resp, post);
			return;
		};
		this.emit('post', data, post);
		return;
	}

	_queryConfiguration.call(this);
	return this;

}

util.inherits(TwitterHandler,emitter);
exports = module.exports = TwitterHandler;
