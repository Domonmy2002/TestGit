var net = require("net");

//var client = net.connect({port : 8124}, function(){
var client = new net.Socket();
client.connect(8124, "127.0.0.1", function(){
	console.log("client connected");
	client.write("word\r\n");
});

client.on("data", function(data){
	console.log(data.toString());
	client.end();
});

client.on("end", function(){
	console.log("client disconnected");
});