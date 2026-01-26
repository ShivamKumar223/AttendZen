import mongoose from "mongoose";

// unique key = userId + classId
const enroledSchema = new mongoose.Schema({
    userId : {
        type: Number,
        required : true
    },

    classId : { 
        type : String, 
        required: true
    },

    studentName: {
            type: String,
            required : true,
            trim: true
        },
    
    rollNo : {
        type : String,
        required: true,
        trim : true
    },

    attendance: {
       type :  [ Date ],
       default : []
    },

    status:{
        type:String,
        default: "pending"
        // after accept status will be "accepted";
        // after reject status will be "rejected";
    }
});

const Enrolments = mongoose.model("enrolment", enroledSchema);
export default Enrolments;