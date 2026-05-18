import { useNavigate } from "react-router-dom";

import "./css/home.css";
import { NavLink } from 'react-router-dom';
import { useState } from "react";

export const Home = () => {
  const [email, setEmail]= useState("");

  const navigate = useNavigate();
  const sendToSignupPage = ()=>{
       navigate(`/signup/${email}`)
  }

  return (
    <div className={`home-page`}>
      <h1>AttendZen</h1>
      <p>
        Here you can mark and manage attendance easly, accurately and securely with minimum efforts.
      </p>
      <div className='signup-button'>
        <form onSubmit={sendToSignupPage} action="">
           <input onChange={(e)=>setEmail(e.target.value)} value={email} type="email" placeholder='Enter Your  Email' required/>
           <button type='submit'>sign up</button>
           
        </form>
      </div>
    </div>
  )
}
