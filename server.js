var http = require("http");

http.createServer(function(request, response){
	console.log("reviced a request.");
	response.writeHead(200, {"Content-Type" : "text/plain"});
	response.write("oh~Yeah! this is a server test!开始啦:D~");
	response.end();
}).listen(8888);

console.log("started server.");