import { useNavigate, useParams } from "react-router-dom";
import "./css/anClass.css";
import { useEffect, useState } from "react";
import axios from "axios";


export const AnClass = () => {
   const navigate = useNavigate();
   const [students, setStudents] = useState([]);
   const { classId } = useParams();

   const getAllStudents = async()=>{
          try{
            const res = await axios.get(`http://localhost:7000/api/teacher/get-details/${classId}`);
   
            if(res.status == 200)
            setStudents(res.data);
            console.log(res.data);
         }
         catch(error)
         {
           console.error(error);
         }
       }
       
       useEffect(()=>{
        getAllStudents();
       },[])


  return (
    <div className="AnClass-students">
      <div className="class-details">
        
                <p>Title : CSE</p>
                <p>Subject : NSC</p>
                <p>Teacher Name : Ramandeep Ma'am</p>
                <p>Class Id : 123456</p>
                <p>Total Students: 35</p>
      </div>

          <ul className="student-container">
             {
                students?.map((student)=>{
                return  <li onClick={()=>navigate("/teacher/attendance-details")} className="student">
                           <p>Student Name : {student.studentName}</p>
                           <p>Roll No. : {student.rollNo}</p>
                           <p>Total Attendance: {student.attendance.length}</p>
                           <p>Status: {student.status}</p>
                     </li>
              })
             }
          </ul>
    </div>
  )
}
