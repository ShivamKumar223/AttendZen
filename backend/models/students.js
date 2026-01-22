import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
    userId : {
        type: Number,
        required : true,
        unique : true
    },
     
    enroledIn : {
        type : [Number],
        unique : true,
        default : []
    }
});

module.exports = mongoose.model("student", studentSchema);