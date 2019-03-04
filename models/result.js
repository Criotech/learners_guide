let mongoose = require("mongoose");

let Schema = mongoose.Schema;

let resultSchema = new Schema({
    name: {type: String},
    score: {type: String},
    topic: {type: String},
 });


module.exports = mongoose.model("Result", resultSchema);