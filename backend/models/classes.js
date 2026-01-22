import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
    classId: {
        type : Number,
        required : true,
        unique : true
    },

    className : {
        type : String,
        required: true,
        trim : true
    },

    subject :{
        type : String,
        required : true,
        trim : true
    },

    teacherName : {
        type : String,
        required : true,
        trim : true
    },

    students : {
        type : [ Number ],
        default : []
    }
});

module.exports = mongoose.model("class", classSchema);