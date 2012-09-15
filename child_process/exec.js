var exec = require("child_process").exec;
//png图片压缩
process.nextTick(function(){
	var args = process.argv.slice(2);
	if(args.length < 2) throw Error("Invalid parameters..");
	exec("E:/software/pngcrush-1.7.15/pngcrush.exe -rem alla -brute " + args[0] + " " + args[1], function(error, stdout, stderr){
		console.log("stdout:" + stdout);
		console.log("stderr:" + stderr);
		if(error != null){
			console.log("error:" + error);
		}
	});
});