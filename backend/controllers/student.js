import Students from "../models/students.js";
import Enrolments from "../models/enrolments.js";
import Classes from "../models/classes.js";


// Completed : Review when add Frontend
// To show student dashboard
export const showStudentDashboard = async (req, res) => {
    const { userId } = req.body;
    const { enroledIn } = await Students.findOne({userId},{enroledIn:1});
    // console.log(enroledIn)
    const classes = await Classes.find({classId: {$in:[...enroledIn]}})
    // console.log(classes)
    if(classes.length == 0)
        res.send("You are not enroled in any classes");
    else
        res.send(classes);
}



// Completed : Review when add Frontend
// To send join request to teacher
export const sendJoinRequest = async (req, res) => {
    const { classId, userId, studentName, rollNo } = req.body;
    const isClass = await Classes.findOne({classId});
    if(isClass){
    const flag = await Enrolments.findOne({$and:[{classId},{userId}]});
    if(flag)
    {
        res.send("You are already in this class.")
    }else{
    await Enrolments.insertOne({ userId, classId, studentName, rollNo });
    await Classes.updateOne({ classId }, { $push: { students : userId } });
    await Students.updateOne({ userId }, {$push: {enroledIn: classId}})
    res.send("You are joined.");
    }
}else res.send("Such class does not exist.")
}



// Completed : Review when add Frontend
// To check attendance details
export const showAttendanceDetails = async(req, res) => {
    const { classId, userId } = req.params;
    if(classId && userId){
    const { attendance } = await Enrolments.findOne({$and: [{classId},{userId}]},{_id:0, attendance:1});
    res.send(attendance);
    }
    else
        res.send("Please send classId and userId");
}