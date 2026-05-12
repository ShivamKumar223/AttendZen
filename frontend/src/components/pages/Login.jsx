import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';


import "./css/signup_login.css";

export const Login = () => {

  const [email, setEmail] = useState();
  const [greeting, setGreeting] = useState("Good Morning !");

  const navigate = useNavigate();


  useEffect(()=>{
          const Time = new Date(Date.now()).getHours();
          if(Time >= 12 && Time<=16)
               setGreeting("Good Afternoon !")
          else if(Time >= 16 && Time<=20)
               setGreeting("Good Evening !")
          else if(Time>20) 
               setGreeting("Good Night !")
  },[])

  const handleSubmit = (e)=>{
    e.preventDefault();
    navigate("/role-selection");
  }


  return (
    <div className='signup-page'>
      
      <form onSubmit={handleSubmit} className='show'>
        <h2>Login</h2>
        <div className='greeting'>
            <p>Hello !</p>
            <p>{greeting}</p>
        </div>
        <input onChange={(e)=>setEmail(e.target.value)} value={email} className='input' type="text" placeholder='Enter Email'/>
        <input className='input' type="text" placeholder='Enter Password'/>
       <div className='forget'>
          <NavLink to="/forget-password">forget Password</NavLink>
        </div>
        <button  className='login_button' type='submit'>Log in</button>
         <div className='isAccount'>
          <p>Don't have an accout? <NavLink to="/signup">Sign up</NavLink></p>
        </div>
      </form>
    </div>
  )
}
