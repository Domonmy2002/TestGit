var spawn = require("child_process").spawn,
	free = spawn("free", ["-m"]);
	
free.stdout.on("data", function(data){
	console.log("标准输出:\n" + data);
});

free.stderr.on("data", function(data){
	console.log("标准错误输出:\n" + data);
});

free.on("exit", function(code, signal){
	console.log("子进程已退出，代码:" + code);
});
