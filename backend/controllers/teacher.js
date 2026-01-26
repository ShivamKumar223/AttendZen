import Teachers from "../models/teachers.js";
import Classes from "../models/classes.js";
import Students from "../models/students.js";
import Enrolments from "../models/enrolments.js";

// To generate unique id for a particular class
const IdGenerator = async () => {
    const root = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz1234567890";
    let classId = "";
    for (let i = 0; i < 6; i++) {
        classId += root[Math.floor(Math.random() * 62)];
    }
    const flag = await Classes.findOne({ classId })
    // console.log(flag)
    if (flag) {
        IdGenerator();
    } else {
        return classId;
    }
}



// Completed : Review when add Frontend
// To show teacher dashboard
export const showTeacherDashboard = async (req, res) => {
    const { userId } = req.body;
    if (userId) {
        const { classes } = await Teachers.findOne({ userId }, { classes: 1, _id: 0 });
        if (classes.length == 0)
            return res.send("You have no any classes");
        const classesInDetail = await Classes.find({ classId: { $in: [...classes] } });
        res.send(classesInDetail)
    } else {
        res.send("Please Send userId")
    }
}




// Completed : Review when add Frontend
// To create new class
export const createNewClass = async (req, res) => {
    // console.log(req.body)
    const { className, teacherName, subject, userId } = req.body;
    let newClass = { className, teacherName, subject }
    const classId = await IdGenerator();
    // console.log(classId)
    newClass = { ...newClass, classId }
    if (userId) {
        await Classes.insertOne({ ...newClass })
        await Teachers.updateOne({ userId }, { $push: { classes: classId } });
        res.send({ Message: "Class created", ...newClass })
    } else {
        res.send("Please enter userId")
    }
}




// Completed : Review when add Frontend
// To update class details
export const updateClassDetails = async (req, res) => {
    const classId = req.params.classId;
    const newData = req.body;
    if (classId) {
        const result = await Classes.updateOne({ classId }, { $set: { ...newData } })
        if (result.matchedCount == 0)
            res.send("Invaled classId");
        else
            res.send("class updated");
    } else {
        res.send("Please send classId");
    }
}





// Completed : Review when add Frontend
// To delete class
export const deleteClass = async (req, res) => {
    const classId = req.params.classId;
    const { userId } = req.body;
    if (classId && userId) {
        const result = await Classes.deleteOne({ classId });
        await Enrolments.deleteMany({ classId })
        if (result.deletedCount)
            await Teachers.updateOne({ userId }, { $pull: { classes: classId } })
        res.send("class deleted");
    } else {
        res.send("Please send classId and userId");
    }

}



// Completed : Review when add Frontend
// To retrive all students which present in a particular class
export const retriveAllStudensts = async (req, res) => {
    const classId = req.params.classId;
    const isClass = await Classes.find({ classId });
    // console.log(isClass)
    if (isClass.length) {
        let enrolments = await Enrolments.find({ classId }, { _id: 0, status: 0, __v: 0 });
        // To modify attendence fild of each enroler and return total attendance except array of dates
        enrolments = enrolments.map((enroler) => {
            enroler = { ...enroler._doc };
            return { ...enroler, attendance: enroler.attendance.length };
        })
        res.send(enrolments);
    }
    else
        res.send("Invaled classId");
}



// Completed : Review when add Frontend
// To mark attendance
export const markAttendance = async (req, res) => {
    const { classId, ...students } = req.body;        //students is also an object
    // console.log(students.userId)                 // An array
    await Enrolments.updateMany({ $and: [{ classId }, { userId: { $in: [...students.userId] } }] }, { $push: { attendance: Date.now() } })

    // send notification to students, present or absent

    res.send(`Attendance marked of students: ${students.userId}`)
}




// Completed : Review when add Frontend
// To retrive all details(attendatence detail) of a particular student
export const retriveAttendanceDetails = async (req, res) => {
    const { userId, classId } = req.params;
    // console.log(userId, classId )
    const isAnyStudentExist = await Enrolments.findOne({ classId });
    if (isAnyStudentExist) {
        // If any students not exist in the class then It return null because classId will not exist in Enrolment collection
        const attendance = await Enrolments.findOne({ $and: [{ userId }, { classId }] }, { _id: 0, attendance: 1 });
        if (attendance)
            res.send(attendance);
        else
            res.send("This student is not exist is this class");
    } else
        res.send("No any student in this class");
}




// Completed : Review when add Frontend
// To remove student from class
export const removeStudentFromClass = async (req, res) => {
    const { userId, classId } = req.params;
    if(userId && classId){
    await Enrolments.deleteOne({ $and: [{ userId }, { classId }] });
    await Classes.updateOne({ classId }, { $pull: { students: userId } });
    await Students.updateOne({ userId }, { $pull: { enroledIn: classId } });
    res.send("This students remove from class");
    }else
        res.send("Please send both userId and classId.")
}




// To retrive attendance of students at particulat date
export const retriveStudentsAtDate = (req, res) => {

    res.send("These students were present on this date");
}



// 🤔
// Optional, because it can violet application importance 🤔
// To update attendance or edit attendance
export const updateAttendance = (req, res) => {

    res.send("Attendance updated");
}
