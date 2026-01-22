import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema({
    userId : {
        type : Number,
        required : true,
        unique : true
    },

    classes : {
        type : [Number],
        default : []
    },

});

module.exports = mongoose.model("teacher", teacherSchema);