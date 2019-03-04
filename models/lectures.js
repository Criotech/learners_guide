let mongoose = require("mongoose");

let Schema = mongoose.Schema;

let lectureSchema = new Schema({
    title: { type: String },
    postImage: { type: String },
    link : {type: String},
    introduction: { type: String },
    prerequisites: { type: String },
    content: { type: String },
    is_visible: {
        type: Boolean,
        default: true
    },
    createdDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Lecture", lectureSchema);
