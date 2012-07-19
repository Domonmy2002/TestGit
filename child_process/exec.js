var exec = require("child_process").exec;
exec("dir", function(error, stdout, stderr){
	console.log("stdout:" + stdout);
	console.log("stderr:" + stderr);
	if(error != null){
		console.log("error:" + error);
	}
});
