var http = require("http");

var server = http.createServer(function(req, res){
	var now = new Date();

	//1.Expires http/1.0
	//res.setHeader("Expires", (new Date(now.getTime() + 20000)).toUTCString());
	//2.Cache-Control http/1.1
	//res.setHeader("Cache-Control", "max-age=20");

	var ifModifiedSince = req.headers["if-modified-since"],
		ifNoneMatch = req.headers["if-none-match"],
		iMs = false;
	/*if(ifModifiedSince){
		var imsDate = Date.parse(ifModifiedSince);
		iMs = now.getTime() - imsDate < 20000;
	}*/
	/*if(ifNoneMatch){
		var et = parseInt(ifNoneMatch);
		iMs = now.getTime() - et < 20000;
	}*/
	if(iMs){
		res.writeHead(304, {"Content-Type" : "text/plain; charset=utf-8"});
		res.end();
	}else{
		//3.Last-Modified
		//res.setHeader("Last-Modified", now.toUTCString());
		//4.ETag
		//res.setHeader("ETag", now.getTime());
		
		//res.setHeader("Connection", "close");
		res.setHeader("Set-Cookie", "test_cookie=test;expires=" + (new Date(now.getTime() + 20000)).toUTCString()+ "; test_cookie2=test2");
		res.writeHead(200, {"Content-Type" : "text/plain; charset=utf-8"});	
		res.end("jsonpCb('" + now.toString() + "')");
	}
});

server.listen(8899);