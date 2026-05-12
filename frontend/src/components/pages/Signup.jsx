import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import "./css/signup_login.css";
import { EmailVerification } from './EmailVerification';


export const Signup = () => {
  const [email, setEmail] = useState("");
  const [show, setShow]=useState("first");

  const navigate = useNavigate();
  const handleFormSubmition = (e) =>{
    e.preventDefault();
      navigate("/login")
  }

  
  return (
    <div className='signup-page'>
      <EmailVerification show={show} setShow={setShow} fixEmail={setEmail}/>
      <form onSubmit={handleFormSubmition} className={`${show=="first"?"hidden":"show"}`} action="">
        <h2>Sign up</h2>
        <input className='input' value={email} readOnly type="email" placeholder='Enter Email'/>
        <input className='input' type="text" placeholder='Enter Name' required />
        <input className='input' type="text" placeholder='Enter Password' required/>
        <input className='input' type="text" placeholder='Confirm Password' required/>
        <div className='sure'>

          <input type="checkbox" name="" id="makeSure" required/>
          <label htmlFor="makeSure">Are you sure form is correctly filled</label>
          </div>
        <div className='signup_button'>
          <p >Happy Journey👍</p>
        <button type='submit'>Sign up</button>
        </div>
      </form>
    </div>
  )
}
