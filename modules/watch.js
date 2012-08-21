var fs = require("fs");
var path = require("path");
var util = require("util");
/**
 * node $WATCH_JS_HOME/watch.js srcDir disDir regexp
 * regexp -- �� "^\." (��""���)
 */
var srcDir = "";  //����1--Դ���·��
var disDir = "";  //����2--Ŀ��·��
var filterRx = null;  //�����ļ�������
var tempFileNames = {};  //��¼Դ���·���ļ���(�����Լ��༭���ļ�)
(function(){
	if(process.argv.length < 4){
		throw new Error("Invalid parameters.");
	}
	srcDir = process.argv[2];
	disDir = process.argv[3];
	//log("RegExp -------> " + process.argv[4]);
	(process.argv.length > 4) && (filterRx = new RegExp(process.argv[4]));	
	addWatcher("", "");  //��ʼĿ¼����Ŀ¼/�ļ����(������Ŀ¼)
	initSyncFiles("", "");  //��ʼͬ���ļ�
	//log("my files ==> " + util.inspect(tempFileNames));
})();

/**
 * ��ʼͬ���ļ�
 * @param {Object} dir
 * @param {Object} filename
 */
function initSyncFiles(dir, filename){
	fs.stat(srcDir + dir + filename, function(err, stats){
		if(err) throw err;
		if(stats.isDirectory()){  //Ŀ¼,�ݹ�
			var files = fs.readdirSync(srcDir + dir + filename);
			files.forEach(function(fname){
				initSyncFiles(dir + filename + "/", fname);
			});
		}else{
			if (!fs.existsSync(disDir + dir + filename)) {  //Ŀ���ļ�������
				copyFiles(dir, filename);
			}else{  //���Դ�ļ��Ƿ��ѷ����޸�
				fs.stat(disDir + dir + filename, function(err2, stats2){
					if (err2) throw err2;
					if (stats.mtime.getTime() != stats2.mtime.getTime()) { //�ļ��ѷ����޸�,ͬ��
						copyFiles(dir, filename);
					}
				});
			}
		}
	});
}

/**
 * Ŀ¼��ػص�
 * @param {Object} dir
 */
function watchFloder(dir){
	return function(event, filename){
		if(event != "rename") return;
		if(filename){   //����Ŀ¼/�ļ�			
			copyFiles(dir, filename);
			addWatcher(dir, filename);
			//log("my files ==> " + util.inspect(tempFileNames));
		}else{  //������ɾ��Ŀ¼/�ļ�(Ҫ������)
			var srcFiles = fs.readdirSync(srcDir + dir);
			var disFiles = fs.readdirSync(disDir + dir);
			var needDelFiles = disFiles.filter(function(fname){  //���˳�Ŀ����Դ�Ĳ���
				return !~srcFiles.indexOf(fname);
			});
			delFiles(dir, needDelFiles);
		}
	};
}

/**
 * ����ļ��ص�
 * @param {Object} dir
 * @param {Object} fname
 */
function watchFile(dir, fname){
	return function(curr, prev){
		if(curr.size == 0){ //����Ը�Դ�ļ����
			fs.unwatchFile(srcDir + dir + fname);
			return;
		}
		if(curr.mtime.getTime() != prev.mtime.getTime()){  //�ļ������Ķ�,ͬ������Ŀ���ļ�
			copyFiles(dir, fname);
		}
	};
}

/**
 * ����Ŀ¼/�ļ����	
 * @param {Object} dir
 * @param {Object} filename
 */
function addWatcher(dir, filename){
	if(filterRx && filterRx.test(filename)) return;  //�����ļ���
	(dir + filename != "") && (tempFileNames[dir + filename] = true);
	var stats = fs.statSync(srcDir + dir + filename);
	if(stats.isDirectory()){  //Ŀ¼
		var wer = fs.watch(srcDir + dir + filename, watchFloder(dir + filename + "/"));
		wer.on("error", function(){  //��س���(��ص�Ŀ¼��ɾ��),�رո�Ŀ¼�ļ��
			wer.close();
		});
		log("init watcher folder : " + srcDir + dir + filename);
		//�ݹ������Ӽ����
		var srcFiles = fs.readdirSync(srcDir + dir + filename);
		if(!srcFiles || srcFiles.length == 0) return;
		srcFiles.forEach(function(fname){
			if(fname.indexOf(".") == 0) return;
			addWatcher(dir + filename + "/", fname);
		});
	}else{  //�ļ�
		fs.watchFile(srcDir + dir + filename, watchFile(dir + "/", filename));
		log("init watcher file : " + srcDir + dir + filename);
	}
}

/**
 * �ļ�����
 * @param {Object} dir
 * @param {Object} fnames
 */
function copyFiles(dir, fnames){
	if(!fnames || fnames.length == 0) return;
	if(typeof fnames == "string"){
		fnames = [fnames];
	}
	fnames.forEach(function(fname){
		if(filterRx && filterRx.test(fname)) return;  //�����ļ���
		var stats = fs.statSync(srcDir + dir + fname);
		if(stats.isDirectory()){  //Ŀ¼(�ݹ鸴���Ӽ�)
			if(!fs.existsSync(disDir + dir + fname)){
				fs.mkdirSync(disDir + dir + fname);
			}
			log("add a new folder : " + disDir + dir + fname);
			copyFiles(dir + fname + "/", fs.readdirSync(srcDir + dir + fname));
		}else{  //�ļ�
			process.nextTick(function(){
				var data = fs.readFileSync(srcDir + dir + fname);
				fs.writeFileSync(disDir + dir + fname, data);
				fs.open(disDir + dir + fname, "r+", function(err, fd){  //���޸�Ŀ���ļ�
					if(err) throw err;
					fs.futimesSync(fd, stats.atime, stats.mtime);  //ͬ���ļ�ʱ���
					fs.close(fd);
				});				
				log("copy file : " + srcDir + dir + fname + " to " + disDir + dir + fname);
			});
		}
	});
}

/**
 * ɾ��Ŀ¼/�ļ�
 * @param {Object} dir
 * @param {Object} fnames
 */
function delFiles(dir, fnames){
	if(!fnames || fnames.length == 0) return;
	fnames.forEach(function(fname){
		if(!fs.existsSync(disDir + dir + fname)){  //Ŀ���ļ�������
			return;
		}
		if (!tempFileNames[dir + fname]) {
			log(dir + fname + " is not your file. skip delete.");
			return; //�������Լ��༭���ļ�,����ɾ����˵��ļ�
		}
		var stats = fs.statSync(disDir + dir + fname);
		if(stats.isDirectory()){  //Ŀ¼,�ݹ�ɾ�����ļ�
			delFiles(dir + fname + "/", fs.readdirSync(disDir + dir + fname));
			fs.rmdirSync(disDir + dir + fname);
		}else{  //ɾ���ļ�
			fs.unwatchFile(srcDir + dir + fname);
			fs.unlinkSync(disDir + dir + fname);
		}
		delete tempFileNames[dir + fname];
		//log("my files ==> " + util.inspect(tempFileNames));
		log("delete " + (stats.isDirectory() ? "folder" : "file") + " : " + disDir + dir + fname);
	});	
}

/**
 * ��־��ʽ������
 * @param {Object} msg
 */
function log(msg){
	var now = new Date();
	console.log(now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate()
				 + " " + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + " --> " + msg);
}
