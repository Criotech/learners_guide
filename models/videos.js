let mongoose = require("mongoose");

let Schema = mongoose.Schema;

let videoSchema = new Schema({
    title: { type: String },
    postImage: { type: String },
    link : {type: String},
    summary: { type: String },
    videolink: { type: String },
    createdDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Video", videoSchema);
