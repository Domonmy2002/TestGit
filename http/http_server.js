var http = require("http");

var server = http.createServer(function(req, res){
	console.log("recive a request : " + req.url);
	console.log("request headers : " + JSON.stringify(req.headers));
	res.writeHead(200, {"Content-Type" : "text/plain; charset=utf-8"});
	res.end("hello ee~");
});

server.listen(8012, "localhost");