var spawn = require("child_process").spawn,
	free = spawn("free", ["-m"]);
	
free.stdout.on("data", function(data){
	console.log("��׼���:\n" + data);
});

free.stderr.on("data", function(data){
	console.log("��׼�������:\n" + data);
});

free.on("exit", function(code, signal){
	console.log("�ӽ������˳�������:" + code);
});
