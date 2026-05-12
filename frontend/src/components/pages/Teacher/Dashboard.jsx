import { useNavigate } from "react-router-dom";

import "./css/dashboard.css";
import { useEffect, useState } from "react";
import axios from "axios";


export const TeacherDashboard = () => {
   const navigate = useNavigate();
   const [classes, setClasses] = useState([]);
    
    const getClassStudents = (classId)=>{
        navigate(`/teacher/an-class/${classId}`)
    }

    const getAllStudents = async()=>{
       try{
         const res = await axios.get(`http://localhost:7000/api/teacher/${1}`);

         if(res.status == 200)
          setClasses(res.data);
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

  if(classes.length == 0) return <h2 style={{textAlign:"center", padding:"10%"}}>You have no any classes</h2>
  return (
    <div className="teacher-dashboard">
      <h1>All Classes</h1>
          <ul className="class-container">
              {           
                classes?.map((data)=>{
                  return <li onClick={()=>getClassStudents(data.classId)} className="class">
                                <p>Title : {data.className}</p>
                                <p>Subject : {data.subject}</p>
                                <p>Total Students : {data.students.length}</p>
                                <p>Teacher Name : {data.teacherName}</p>
                                <p>Code : {data.classId}</p>
                           </li>
                })
              }
          </ul>
    </div>
  )
}
