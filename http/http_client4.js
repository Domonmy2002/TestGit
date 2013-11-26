var http = require("http"),
	querystring = require("querystring"),
	fs = require("fs"),
	lineReader = require("line-reader");

if(process.argv.length < 3){
	throw new Error("Invalid parameters.");
}

var filePath = process.argv[2];
var tarPath1 = process.argv[3] || "ppUrl.txt";
var tarPath2 = process.argv[4] || "wgUrl.txt";
var errPath1 = "err4-pp.txt";
var errPath2 = "err4-wg.txt";

if(fs.existsSync(tarPath1)){
	fs.unlinkSync(tarPath1);
}
if(fs.existsSync(tarPath2)){
	fs.unlinkSync(tarPath2);
}
if(fs.existsSync(errPath1)){
	fs.unlinkSync(errPath1);
}
if(fs.existsSync(errPath2)){
	fs.unlinkSync(errPath2);
}
var cou = 0;
lineReader.eachLine(filePath, function(line, last){
	++cou;
	//if(cou > 50) return false;
	var kw = line.trim();
	sendReqPp(kw);
	sendReqWg(kw);
	//console.log(kw + " : " + line);
	if(last){
		console.log(cou + " keyword had finish change...:D");
		return false;
	}
});

function sendReqPp(keyword){
	if(!keyword){
		return;
	}
	var url = "http://se.paipai.com/comm_search?KeyWord={#keyword#}&Platform=1&charSet=gbk&ac=0&as=1&Property=128";
	
	var req = http.get(url.replace("{#keyword#}", encodeURIComponent(keyword)), function(res){
		try{
			var locUrl = res.headers["location"].replace("-as,1", "-as,0");  //主动改被动
			if(locUrl.indexOf("http://s.paipai.com/") == 0){
				fs.appendFileSync(tarPath1, locUrl + "\r\n");
			}else{
				console.log("retry pp --> " + keyword);
				sendReqPp(keyword);
			}
		}catch(e){
			console.log("exption ==> " + keyword);
			fs.appendFileSync(errPath1, keyword + "\r\n");
		}
	});
	req.on("error", function(e){
		console.log('problem with request: ' + e.message);
		console.log("error ==> " + keyword);
		fs.appendFileSync(errPath1, keyword + "\r\n");
	});
}

function sendReqWg(keyword){
	if(!keyword){
		return;
	}
	var url = "http://se.wanggou.com/comm_search?KeyWord={#keyword#}&Platform=2&charSet=gbk&ac=0&as=1&Property=2199023255680";
	
	var req = http.get(url.replace("{#keyword#}", encodeURIComponent(keyword)), function(res){
		try{
			var locUrl = res.headers["location"].replace("-as,1", "-as,0");  //主动改被动
			if(locUrl.indexOf("http://s.wanggou.com/") == 0){
				fs.appendFileSync(tarPath2, locUrl + "\r\n");
			}else{
				console.log("retry wg --> " + keyword);
				sendReqWg(keyword);
			}
		}catch(e){
			console.log("exption ==> " + keyword);
			fs.appendFileSync(errPath2, keyword + "\r\n");
		}
	});
	req.on("error", function(e){
		console.log('problem with request: ' + e.message);
		console.log("error ==> " + keyword);
		fs.appendFileSync(errPath2, keyword + "\r\n");
	});
}