import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
    userId : {
        type: Number,
        required : true,
        unique : true
    },
     
    enroledIn : {
        type : [String],
        unique: false,
        default : []
    }
});

const Students = mongoose.model("student", studentSchema);
 
export default Students;