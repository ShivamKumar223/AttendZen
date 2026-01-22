import mongoose from "mongoose";

const enroledSchema = new mongoose.Schema({
    userId : {
        type: Number,
        unique : true,
        required : true
    },

    enroledIn: {
       type :  [ Number],
       default : []
    }
});

module.exports = mongoose.model("enroledIn", enroledSchema);