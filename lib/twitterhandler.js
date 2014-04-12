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
	this._semaphore = false;
	this.length = 25;

	// "public" function to post to twitter
	// it is the callers responsibility to ensure that post is under 140
	// characters, etc. If twitter fails to post the text, the post object
	// will be returned with the `error` event.
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

	// "public" function to start a user stream. onData and onEnd are emitted.
	// request object (this._userStream) is saved so that the connection can be
	// torn down gracefully.
	this.startUserStream = function () {
		this._userStream = this._twitter.getStream(
			'user', 
			{}, 
			this._accTok, 
			this._accTokSec,
			_onData.bind(this),
			_onEnd.bind(this)
			);
	}

	// get the configuration options from twitter
	function _queryConfiguration () {
		this._twitter.help(
			'configuration',
			{},
			this._accTok,
			this._accTokSec,
			_updateLinkLength.bind(this)	
			);
	}

	// update the length of t.co shortened links. publicly accessible
	function _updateLinkLength (err, data, resp) {
		if (err) {
			this.emit('error', err);
			return;
		};

		if (data.short_url_length_https) {
			this.length = data.short_url_length_https;
		};

		this.emit('ready', data);
		return;
	}

	// process data from user stream
	function _onData (err, data, raw, resp) {
		if (err) {
			this.emit('error', err, raw, resp);
			return;
		};
		// emit the entire data object and resp if anyone's interested
		this.emit('streamData', data, raw, resp);

		// Direct messages
		if (data.direct_message) {
			this.emit('dm', data);
			return;
		};

		if (data.event) {
			switch (data.event) {
				case 'follow':
					this.emit('followed', data);
					break;
				case 'favorite':
					if (data.target.screen_name === this._screen_name) {
						this.emit('favorited', data);
					}; 
					break;
				case 'unfavorite':
					if (data.target.screen_name === this._screen_name) {
						this.emit('unfavorited', data);
					}; 
					break;
			}

			// console.error('\n\nTwitterHandler.js >_onData > ~127');
			// console.error(util.inspect(data));
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
			// data isn't really data. it's the response :(
			this.emit('error', err, data, post);
			return;
		};

		this.emit('post', data, resp, post);
		return;
	}

	_queryConfiguration.call(this);
	return this;

}

util.inherits(TwitterHandler,emitter);
exports = module.exports = TwitterHandler;
