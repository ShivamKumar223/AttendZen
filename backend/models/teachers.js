import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema({
    userId : {
        type : Number,
        required : true,
        unique : true
    },

    classes : {
        type : [String],
        default : []
    },

});

const Teachers = mongoose.model("teacher", teacherSchema);
export default Teachers;