var fs = require("fs");
var path = require("path");
var util = require("util");
/**
 * node $WATCH_JS_HOME/watch.js srcDir disDir regexp
 * regexp -- 如 "^\." (用""封闭)
 */
var srcDir = "";  //参数1--源监控路径
var disDir = "";  //参数2--目标路径
var filterRx = null;  //过滤文件名正则
var tempFileNames = {};  //记录源监控路径文件名(属于自己编辑的文件)
(function(){
	if(process.argv.length < 4){
		throw new Error("Invalid parameters.");
	}
	srcDir = process.argv[2];
	disDir = process.argv[3];
	//log("RegExp -------> " + process.argv[4]);
	(process.argv.length > 4) && (filterRx = new RegExp(process.argv[4]));	
	addWatcher("", "");  //初始目录里子目录/文件监控(包括本目录)
	initSyncFiles("", "");  //初始同步文件
	//log("my files ==> " + util.inspect(tempFileNames));
})();

/**
 * 初始同步文件
 * @param {Object} dir
 * @param {Object} filename
 */
function initSyncFiles(dir, filename){
	fs.stat(srcDir + dir + filename, function(err, stats){
		if(err) throw err;
		if(stats.isDirectory()){  //目录,递归
			var files = fs.readdirSync(srcDir + dir + filename);
			files.forEach(function(fname){
				initSyncFiles(dir + filename + "/", fname);
			});
		}else{
			if (!fs.existsSync(disDir + dir + filename)) {  //目标文件不存在
				copyFiles(dir, filename);
			}else{  //检查源文件是否已发生修改
				fs.stat(disDir + dir + filename, function(err2, stats2){
					if (err2) throw err2;
					if (stats.mtime.getTime() != stats2.mtime.getTime()) { //文件已发生修改,同步
						copyFiles(dir, filename);
					}
				});
			}
		}
	});
}

/**
 * 目录监控回调
 * @param {Object} dir
 */
function watchFloder(dir){
	return function(event, filename){
		if(event != "rename") return;
		if(filename){   //新增目录/文件			
			copyFiles(dir, filename);
			addWatcher(dir, filename);
			//log("my files ==> " + util.inspect(tempFileNames));
		}else{  //可能是删除目录/文件(要做检验)
			var srcFiles = fs.readdirSync(srcDir + dir);
			var disFiles = fs.readdirSync(disDir + dir);
			var needDelFiles = disFiles.filter(function(fname){  //过滤出目标与源的补集
				return !~srcFiles.indexOf(fname);
			});
			delFiles(dir, needDelFiles);
		}
	};
}

/**
 * 监控文件回调
 * @param {Object} dir
 * @param {Object} fname
 */
function watchFile(dir, fname){
	return function(curr, prev){
		if(curr.size == 0){ //解除对该源文件监控
			fs.unwatchFile(srcDir + dir + fname);
			return;
		}
		if(curr.mtime.getTime() != prev.mtime.getTime()){  //文件发生改动,同步更新目标文件
			copyFiles(dir, fname);
		}
	};
}

/**
 * 增加目录/文件监控	
 * @param {Object} dir
 * @param {Object} filename
 */
function addWatcher(dir, filename){
	if(filterRx && filterRx.test(filename)) return;  //过滤文件名
	(dir + filename != "") && (tempFileNames[dir + filename] = true);
	var stats = fs.statSync(srcDir + dir + filename);
	if(stats.isDirectory()){  //目录
		var wer = fs.watch(srcDir + dir + filename, watchFloder(dir + filename + "/"));
		wer.on("error", function(){  //监控出错(监控的目录被删除),关闭该目录的监控
			wer.close();
		});
		log("init watcher folder : " + srcDir + dir + filename);
		//递归设置子级监控
		var srcFiles = fs.readdirSync(srcDir + dir + filename);
		if(!srcFiles || srcFiles.length == 0) return;
		srcFiles.forEach(function(fname){
			if(fname.indexOf(".") == 0) return;
			addWatcher(dir + filename + "/", fname);
		});
	}else{  //文件
		fs.watchFile(srcDir + dir + filename, watchFile(dir + "/", filename));
		log("init watcher file : " + srcDir + dir + filename);
	}
}

/**
 * 文件复制
 * @param {Object} dir
 * @param {Object} fnames
 */
function copyFiles(dir, fnames){
	if(!fnames || fnames.length == 0) return;
	if(typeof fnames == "string"){
		fnames = [fnames];
	}
	fnames.forEach(function(fname){
		if(filterRx && filterRx.test(fname)) return;  //过滤文件名
		var stats = fs.statSync(srcDir + dir + fname);
		if(stats.isDirectory()){  //目录(递归复制子级)
			if(!fs.existsSync(disDir + dir + fname)){
				fs.mkdirSync(disDir + dir + fname);
			}
			log("add a new folder : " + disDir + dir + fname);
			copyFiles(dir + fname + "/", fs.readdirSync(srcDir + dir + fname));
		}else{  //文件
			process.nextTick(function(){
				var data = fs.readFileSync(srcDir + dir + fname);
				fs.writeFileSync(disDir + dir + fname, data);
				fs.open(disDir + dir + fname, "r+", function(err, fd){  //打开修改目标文件
					if(err) throw err;
					fs.futimesSync(fd, stats.atime, stats.mtime);  //同步文件时间戳
					fs.close(fd);
				});				
				log("copy file : " + srcDir + dir + fname + " to " + disDir + dir + fname);
			});
		}
	});
}

/**
 * 删除目录/文件
 * @param {Object} dir
 * @param {Object} fnames
 */
function delFiles(dir, fnames){
	if(!fnames || fnames.length == 0) return;
	fnames.forEach(function(fname){
		if(!fs.existsSync(disDir + dir + fname)){  //目标文件不存在
			return;
		}
		if (!tempFileNames[dir + fname]) {
			log(dir + fname + " is not your file. skip delete.");
			return; //跳过非自己编辑的文件,避免删错别人的文件
		}
		var stats = fs.statSync(disDir + dir + fname);
		if(stats.isDirectory()){  //目录,递归删除子文件
			delFiles(dir + fname + "/", fs.readdirSync(disDir + dir + fname));
			fs.rmdirSync(disDir + dir + fname);
		}else{  //删除文件
			fs.unwatchFile(srcDir + dir + fname);
			fs.unlinkSync(disDir + dir + fname);
		}
		delete tempFileNames[dir + fname];
		//log("my files ==> " + util.inspect(tempFileNames));
		log("delete " + (stats.isDirectory() ? "folder" : "file") + " : " + disDir + dir + fname);
	});	
}

/**
 * 日志格式化输入
 * @param {Object} msg
 */
function log(msg){
	var now = new Date();
	console.log(now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate()
				 + " " + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + " --> " + msg);
}
