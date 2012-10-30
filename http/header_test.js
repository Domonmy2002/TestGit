var http = require("http");

var server = http.createServer(function(req, res){
	var now = new Date();

	//1.Expires http/1.0
	res.setHeader("Expires", (new Date(now.getTime() + 20000)).toUTCString());
	//2.Cache-Control http/1.1
	res.setHeader("Cache-Control", "max-age=20");


	//res.setHeader("Last-Modified", now.toUTCString());
	//res.setHeader("ETag", "123");
	
	//res.setHeader("Connection", "close");
	res.writeHead(200, {"Content-Type" : "text/plain; charset=utf-8"});	
	res.end("jsonCb('" + now.toString() + "')");
});

server.listen(8899);