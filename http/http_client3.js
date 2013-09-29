var http = require("http"),
	querystring = require("querystring"),
	fs = require("fs");


if(process.argv.length < 3){
	throw new Error("Invalid parameters.");
}

var filePath = process.argv[2];
var tarPath = process.argv[3] || "res3.txt";
var errPath = "err3.txt";
var rs = fs.createReadStream(filePath);

if(fs.existsSync(tarPath)){
	fs.unlinkSync(tarPath);
}
if(fs.existsSync(errPath)){
	fs.unlinkSync(errPath);
}

var data = '';
rs.on("data", function(trunk){
	data += trunk;
});

rs.on("end", function(){
	getTargetUrl(data);
});

function getTargetUrl(adata){
	var rex = new RegExp('\\"(http\\:\\/\\/(buy\\.qq\\.com\\/search2?\\.shtml|www\\.wanggou\\.com\\/search2?\\.shtml|s\\.wanggou\\.com\\/)[^\\"]*)\\"', 'g'),
		len = adata.length;
	
	sendReq(rex, adata, 0);
}

function sendReq(rex, adata, cou){
	//if(cou > 10) return;
	var match = rex.exec(adata);
	if(!match){
		return;
	}
	var	url = match[1];
	
	var req = http.get(url, function(res){
		var das = "";
		res.on("data", function(trunk){
			das += trunk;
		});
		res.on("end", function(){
			if(!~das.indexOf('id="commList"')){
				console.log(cou + " ======> " + url);
				fs.appendFileSync(tarPath, url + "\r\n");
			}else{
				console.log(cou + " --> " + url);
			}
			sendReq(rex, adata, cou + 1);
		});
	});		
	req.on("error", function(e){
		console.log('problem with request: ' + e.message);
		console.log("error ==> " + url);
		fs.appendFileSync(errPath, url + "\r\n");
		sendReq(rex, adata, cou + 1);
	});
}