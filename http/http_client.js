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


//测试ping接口请求
/*for(var i = 0; i < 20; ++i){
	var req = http.get("http://service.paipai.com/cgi-bin/ping?rand=15383&r=&u=http://list1.paipai.com&fu=http%3A%2F%2Flist1.paipai.com%2F0%2C20501-0%2C35859-10%2C1%2Fl---1-48-6-35859--3-4-3----2-2--128-1-0-sf%2C3-mtag%2C1.html&resolution=1920*1080&color=32&cookiesup=1&pageId=0&domainId=0&linkId=0&fpageId=0&fdomainId=0&flinkId=0&sepageid=0&sedomainid=0&selinkid=0&euin=357661421&sc=&g_ty=ls", function(res){
		console.log(res.statusCode);
		res.on('data', function (chunk) {
	    	console.log('BODY: ' + chunk);
	  	});
	});
	req.end();
}*/