var http = require("http"),
	url = require("url"),
	fs = require("fs"),
	path = require("path"),
	zlib = require("zlib"),
	config = require("./config");

var server = http.createServer(function(request, response){
	var urlstr = url.parse(request.url),
		pathname = urlstr.pathname,	
		realPath = path.join(config.fileFolder, pathname.replace(/\.\./g,""));
	if(pathname.slice(-1) === "/"){
		realPath = path.join(realPath, config.Welcome.file);
	}
	
	var pathHandle = function(realPath){
		fs.stat(realPath, function(err, stat){
			if(err){
				response.writeHead(404, {"Content-Type" : "text/plain;charset=utf-8"});
				response.write("the request url " + pathname + " was not found on this server.");
				response.end();
				return;
			}
			if(stat.isDirectory()){
				realPath = path.join(realPath, "/", config.Welcome.file);
				pathHandle(realPath);
				return;
			}
			var ext = path.extname(realPath),
				lastModified = stat.mtime.toUTCString();
			ext = ext ? ext.replace(/^\./,"") : "unknow";
			response.setHeader("Content-Type", (config.types[ext] || "text/plain") + ";charset=utf-8");				
			response.setHeader("Last-Modified", lastModified);
			if(ext.match(config.Expires.fileMatch)){
				var expires = new Date();
				expires.setTime(expires.getTime() + config.Expires.maxAge * 1000);
				response.setHeader("Expires", expires.toUTCString());
				response.setHeader("Cache-Control", "max-age=" + config.Expires.maxAge);
			}
			var ifModifiedSince = request.headers["if-modified-since"];
			if(ifModifiedSince && lastModified == ifModifiedSince){
				response.writeHead(304, "Not Modified");
				response.end();
			}else{
				var raw = fs.createReadStream(realPath),
					acceptEncoding = request.headers['accept-encoding'] || "",
					matched = ext.match(config.Compress.match);
				if(matched && acceptEncoding.match(/\bgzip\b/)){
					response.writeHead(200, "ok", {"Content-Encoding" : "gzip"});
					raw.pipe(zlib.createGzip()).pipe(response);
				}else if(matched && acceptEncoding.match(/\bdeflate\b/)){
					response.writeHead(200, "ok", {"Content-Encoding" : "deflate"});
					raw.pipe(zlib.createDeflate()).pipe(response);
				}else{
					response.writeHead(200, "ok");
					raw.pipe(response);
				}
			}
		});
	};
	console.log(123);
	pathHandle(realPath);
});
server.listen(config.prot);
console.log("server running at port : " + config.prot);
