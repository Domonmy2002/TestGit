var http = require("http"),
	querystring = require("querystring"),
	fs = require("fs");


if(process.argv.length < 3){
	throw new Error("Invalid parameters.");
}

var filePath = process.argv[2];
var tarPath = process.argv[3] || "res.txt";
var errPath = "err.txt";
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
	getTargetUrl(data, data);
});

function getTargetUrl(adata, pdata){
	var rex = new RegExp('\\"(http\\:\\/\\/(buy\\.qq\\.com\\/search2?\\.shtml|www\\.wanggou\\.com\\/search2?\\.shtml)[^\\"]*)\\"', 'g'),
		len = adata.length;
	
	sendReq(rex, adata, pdata, 0);
}

function getUrl(url){
	var suburl = url.substr(url.indexOf("?") + 1);
	var temp = suburl.indexOf("?");
	if(temp != -1){  //多个?号
		suburl = suburl.substr(0, temp);
	}
	var parmas = querystring.parse(suburl);

	var kw = parmas.kw ? parmas.kw : "",
		classId = parmas.id ? parmas.id : "",
	    np = parmas.np ? parmas.np : "",
	    cid = parmas.cid ? parmas.cid : "",
		ptag = parmas.ptag ? parmas.ptag : parmas.PTAG ? parmas.PTAG : "",
		seurl = "http://se.wanggou.com/comm_search?KeyWord={#keyword#}&Platform=2&charSet=gbk&ac=0&as=1&Property=2199023255680",
		pars = [];
	
	seurl = seurl.replace("{#keyword#}", kw.replace(/[\r\n]/g, ""));
	if(classId && classId != "0"){
		seurl += "&sClassid=" + classId.replace(/[\r\n]/g, "");
	}
	cid && pars.push("TopItemId=" + cid.replace(/[\r\n]/g, ""));
	np && pars.push("NewProp=" + np.replace(/[\r\n]/g, ""));
	
	ptag && pars.push("PTAG=" + ptag.replace(/[\r\n]/g, ""));
	if(pars.length > 0){
		seurl += "&" + pars.join("&");
	}
	//console.log(seurl);
	return seurl;
}

function sendReq(rex, adata, pdata, cou){
	var match = rex.exec(adata);
	if(!match){		
		fs.writeFileSync(tarPath, pdata);
		console.log("total ==> " + cou);
		return;
	}
	var	url = match[1],
		seurl = getUrl(url);

	var req = http.get(seurl, function(res){		
		//console.log(url);
		var locUrl = url;
		try{
			locUrl = res.headers["location"].replace("-as,1", "-as,0");  //主动改被动		
		}catch(e){
			console.log("exption ==> " + url);
			fs.appendFileSync(errPath, url + "\r\n");
		}
		sendReq(rex, adata, pdata.replace(url, locUrl), cou + 1);
	});

	req.on("error", function(e){
		console.log('problem with request: ' + e.message);
		console.log("error ==> " + url);
		fs.appendFileSync(errPath, url + "\r\n");
		sendReq(rex, adata, pdata, cou + 1);
	});
}