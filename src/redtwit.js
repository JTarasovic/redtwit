var request = require ("request");
var log = require("console").log;
var util = require("util");

request('http://www.reddit.com/r/android/new.json?sort=new',function(err,resp,body){
	if (!err && resp.statusCode == 200) {
		var newSubmissions = JSON.parse(body);
		newSubmissions = newSubmissions.data.children;
		
		for(var i=0; i < newSubmissions.length; i++) {
			log(newSubmissions[i].data.title + "\n");
		}


		/*for(var k in newSubmissions) {
			if ({}.hasOwnProperty.call(newSubmissions,k)) {
				log(k," = ",newSubmissions[k]);
			};
		}*/

		/*newSubmissions.foreach(function(ele,ind,arr) {
			log(JSON.stringify(ele.data, null, 4 ));
		});*/
		//log(JSON.stringify(newSubmissions, null, 4));
	};
})