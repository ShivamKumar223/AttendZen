// To show teacher dashboard
export const showTeacherDashboard = (req, res)=>{

    res.send("Teacher Dashboard")
}
// To create new class
export const createNewClass = (req, res)=>{

    res.send("Class created")
}

// To update class details
export const updateClassDetails = (req, res)=>{

    res.send("Class updated")
}

// To delete class
export const deleteClass = (req, res)=>{

    res.send("Class deleted");
}

// To mark attendance
export const markAttendance = (req, res)=>{

    res.send("Attendance marked of all students")
}

// To retrive all details of a particular student
export const retriveDetails = (req, res)=>{

    res.send("Detail of one student");
}

// To retrive attendance of students at particulat date
export const retriveStudentsAtDate = (req, res)=>{

     res.send("These students were present on this date");
}

// To retrive all students which present in a particular class
export const retriveAllStudensts = (req, res)=>{

    res.send("These students are available in this class");
}

// To update attendance or edit attendance
export const updateAttendance = (req, res)=>{

    res.send("Attendance updated");
}

// To remove student from class
export const removeStudentFromClass = (req, res)=>{

    res.send("The students remove from class");
}