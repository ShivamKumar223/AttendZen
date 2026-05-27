import { CiCircleList } from "react-icons/ci";
import { RxCross1 } from "react-icons/rx";
import { useState } from "react";

import "./css/T_header.css";
import { NavLink } from "react-router-dom";


export const T_header = () => {
  const [toggle, setToggle] = useState(true);
  return (

    <div className="teacher-header">
      <div className="t-menu">
        <div onClick={() => setToggle(!toggle)} className="menu-button">{toggle ? <CiCircleList /> : <RxCross1 />}</div>
        <h5>AtendZen</h5>
      </div>
      <div className="profile">
        <input type="file" />
      </div>
      <TeacherMenu toggle={toggle} setToggle={setToggle} />
    </div>
  )
}

const TeacherMenu = ({ toggle }) => {

  return (
    <ul className={`menu-list ${toggle ? "hide-menu" : "show-menu"}`}>
      <NavLink><li>Dashboard</li></NavLink>
      <NavLink><li>+ New class</li></NavLink>
      <NavLink><li>Requests</li></NavLink>
      <NavLink><li>Theams</li></NavLink>
      <NavLink><li>Role</li></NavLink>
      <NavLink><li>Feedback</li></NavLink>
      <NavLink><li>Help</li></NavLink>
      <NavLink><li>Support</li></NavLink>
      <NavLink to="/"><li>Log out</li></NavLink>
    </ul>
  )
}