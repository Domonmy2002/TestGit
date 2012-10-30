var http = require("http");

var option = {
	host : "localhost",
	port : 8012,
	path : "/",
	method : "GET",
	headers : {
		"Cache-Control" : "no-cache"
	}
};

var req = http.request(option, function(res){
	console.log("status : " + res.statusCode);
	console.log("headers : " + JSON.stringify(res.headers));
	res.setEncoding("utf-8");
	res.on("data", function(chunk){
		console.log("body : " + chunk);
	});
});

req.on("error", function(e){
	console.log('problem with request: ' + e.message);
});

//req.write("data1\n");
//req.write("data2\n");

req.end();