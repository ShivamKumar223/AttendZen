import { useEffect, useState } from 'react';

import "./css/signup_login.css";
import { NavLink, useParams } from 'react-router-dom';

export const EmailVerification = ({show, setShow, fixEmail}) => {

  const [email, setEmail] = useState(useParams().email);
  const [ userOTP, setUserOTP] = useState("");
  const [OTP, setOTP] = useState("")
  
  
  const sendOTPonEmail = (e)=>{
     e.preventDefault();
    const OTPsource = "abcdefghij1234567890";
    let OTP = "";
    for(let i = 0; i<6; i++)
    {
       OTP = OTP + OTPsource[Math.floor(Math.random()*20)];
    }
   setOTP(OTP);
   alert(OTP)
  }


  const handleVerification = (e)=>{
    e.preventDefault();
    if(userOTP !== "")
    if(OTP === userOTP)
      {
           alert("Email verified");
           fixEmail(email)
           setShow("second");
      } 
    else
        alert("Invalid email or OTP");
    else
        alert("Enter OTP")
  }

  return (
      <form className={`${show=="second"?"hidden":'verification show'}`} action="">
        <h2>Email Verification</h2><br/>
        <input onChange={(e)=>setEmail(e.target.value)} value={email} className='input' type="email" placeholder='Enter Email'/>
        <button onClick={sendOTPonEmail}>Send OTP</button>

        <br/>
        <input type="text" value={userOTP} onChange={(e)=>setUserOTP(e.target.value)} className='input' placeholder='Enter OTP' required/>
        <button onClick={(e)=>handleVerification(e)} type='submit'>Verify</button>
         <div className='isAccount'>
          <p>Have an accout? <NavLink to="/login">Log in</NavLink></p>
        </div>
      </form>

  )
}
