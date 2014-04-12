var TwitterHandler = require('../lib/twitterhandler');
var tHandler = new TwitterHandler();
var util = require('util');

function onReady () {
	tHandler.post('Received ready event...');
	tHandler.startUserStream();
}

function onPost (data, resp, post) {
	console.log('\npost');
	console.error('\n\ntwitterhandlertest.js > onPost > ~12');
	console.error(util.inspect(arguments));
}

function onStream (data, resp) {
	console.log('\nstream');
	console.error('\n\ntwitterhandlertest.js > onStream > ~18');
	console.error(util.inspect(arguments));
}

function onDM (data, resp) {
	console.log('\ndm');
	console.error('\n\ntwitterhandlertest.js > onDM > ~22');
	console.error(util.inspect(arguments));
}

function onFollow (data) {
	console.log('\nfollow!');
	console.error('\n\ntwitterhandlertest.js > onFollow > ~30');
	console.error(util.inspect(arguments));
}

function onFavorite (data) {
	console.log('\nfavorite');
	console.error('\n\ntwitterhandlertest.js > onFavorite > ~36');
	console.error(util.inspect(arguments));
}

function onUnFavorite (data) {
	console.log('\nunfavorite');
	console.error('\n\ntwitterhandlertest.js > onunFavorite > ~42');
	console.error(util.inspect(arguments));
}

function onError (err, resp, post) {
	console.log('\nerror');
	console.error('\n\ntwitterhandlertest.js > onError > ~48');
	console.error(util.inspect(arguments));
}

tHandler.on('ready', onReady);

//tHandler.on('streamData', onStream);

tHandler.on('dm', onDM);
tHandler.on('favorite', onFavorite);
tHandler.on('unfavorite', onUnFavorite);
tHandler.on('follow', onFollow);
tHandler.on('error', onError);
