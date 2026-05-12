import { useEffect, useState } from 'react';

import "./css/signup_login.css";
import { NavLink } from 'react-router-dom';

export const ForgetPassword = () => {

  const [email, setEmail] = useState();


  return (
    <div className='signup-page'>
      
      <form action="">
        <h2>Change Password</h2>
        <input onChange={(e)=>setEmail(e.target.value)} value={email} className='input' type="text" placeholder='Enter Email'/>
       <div className="verify">
             <button>Verify</button>
             <input type="text" placeholder='OTP'/>
        </div>
        <input className='input' type="text" placeholder='Enter Password'/>
        <input className='input' type="text" placeholder='Confirm Password'/>
       <div className='forget'>
        </div>
        <button className='login_button' type='submit'>Submit</button>
         <div className='isAccount'>
          <p>Don't have an accout? <NavLink to="/signup">Sign up</NavLink></p>
        </div>
      </form>
    </div>
  )
}
