import { useNavigate } from "react-router-dom";

import "./css/role-selection.css";

export const RoleSelection = () => {
    const navigate = useNavigate();

  return (
    <div className="Role-Selection">

      <div className="role role-teacher">
        <img src="./teacher.png" alt="teacher pic" />
        <div>
          <b>As a Teacher</b>
          <button onClick={()=>navigate("/teacher")} >Enter</button>
        </div>
      </div>


      <div className="role role-student">
        <img src="./student.png" alt="student pic" />
        <div>
          <b>As a Student</b>
          <button onClick={()=>navigate("/sudent")}>Enter</button>
        </div>
      </div>

    </div>
  )
}
