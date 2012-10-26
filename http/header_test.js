var http = require("http");

var server = http.createServer(function(req, res){
	var now = new Date();

	//res.setHeader("Last-Modified", now.toUTCString());
	//res.setHeader("ETag", "123");
	//res.setHeader("Cache-Control", "max-age=10");	
	res.setHeader("Expires", (new Date(now.getTime() + 10000)).toUTCString());
	//res.setHeader("Connection", "close");
	res.writeHead(200, {"Content-Type" : "text/plain; charset=utf-8"});	
	res.end(now.toString());
});

server.listen(8899);