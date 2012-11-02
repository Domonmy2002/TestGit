var mongoose = require("mongoose");
var db = mongoose.createConnection("localhost", "test");

db.on("error", console.error.bind(console, "连接错误："));
db.once("open", function(){
	console.log("connection to mongoose<test> success~");
});

var PersonSchema = new mongoose.Schema({
	name : {first : String, last : String}
});
//定义虚拟属性
PersonSchema.virtual("name.full").get(function(){
	return this.name.first + " " + this.name.last;
});

var PersonModel = db.model("Person", PersonSchema);

var personEntity = new PersonModel({name : {first:"gg", last:"ohoh"}});
console.log(personEntity.name);

//personEntity.save();

PersonModel.find(function(err, persons){
	for(var i = 0, len = persons.length; i < len; ++i){
		console.log("person : " + i + "\n" + JSON.stringify(persons[i]));
		console.log("full name "  + i + " : " + persons[i].name.full)
	}
});