var TwitterHandler = require('../lib/twitterhandler');
var tHandler = new TwitterHandler();
var util = require('util');

function onReady () {
	tHandler.post('Received ready event...');
	tHandler.startUserStream();
}

function onPost (data, post) {
	console.log(post);
	console.error('\n\ntwitterhandlertest.js > onPost > ~12');
}

function onStream (data, resp) {
	console.error(util.inspect(data));
	console.error(util.inspect(data));
}

function onDM (data, resp) {
	console.log('new dm from: ' + data.source.name);
	console.error('\n\ntwitterhandlertest.js > onDM > ~22');
	console.error(util.inspect(data));
}

function onFollow (data, resp) {
	console.log('follow!');
}

function onFavorite (data, resp) {
	console.log('favorite');	
}

function onError (err, resp, post) {
	console.log(err);

	console.error('\n\ntwitterhandlertest.js > onError > ~36');
	if(err) console.error('err:\n' + util.inspect(err))
	if(resp) console.error('resp:\n' + util.inspect(resp))
	if(post) console.error('post: \n' + util.inspect(post))
}

tHandler.on('ready', onReady);

//tHandler.on('streamData', onStream);

tHandler.on('dm', onDM);
tHandler.on('favorite', onFavorite);
tHandler.on('follow', onFollow);
tHandler.on('error', onError);

/*req.addListener('response', function (res) {
		res.setEncoding('utf-8');
		res.addListener('data', function (chunk) {
			if (chunk == "\r\n") {
				dataCallback(null, {}, chunk, res);
				return;
			} else if (chunk.substr(chunk.length - 2) == '\r\n') {
				msg.push(chunk.substr(0, chunk.length -2));
				var ret = msg.join("");
				//console.log(ret);
				msg = [];
				for (var i = 0; i < ret.length; i++) {
					console.error(ret.charCodeAt(i) + '\t' + ret.charAt(i));
				};

				try {
					dataCallback(null, JSON.parse(ret), ret, res);
				} catch (e) {
				//console.log(e);
				dataCallback({ message: "Error while parsing Twitter-Response.", error: e }, null, chunk, res);
				}	
			return;
			} else {
				msg.push(chunk);
				return;
			}
		});
		res.addListener('end', function() {
			endCallback();
		});
	});
	req.end();*/