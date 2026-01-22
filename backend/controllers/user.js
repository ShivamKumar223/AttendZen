// To show login page
export const showLoginPage = (req, res)=>{

    res.send("Login Page");
}

// To handle user login
export const handleUserLogin = (req, res) =>{

      res.send("Login Success");
}

// To handle user logout
export const handleUserLogout = (req, res) =>{

    res.send("Log out success")
}

// To handle reset password
export const handleResetPassword = (req, res) =>{

    res.send("Password reset")
}

// To handle reset password
export const handleChangePassword = (req, res) =>{

    res.send("Password changed")
}

// To update user profile
export const updateProfile = (req, res)=>{
       
    res.send("Profile Updated")
}

// To edit user profile
export const editProfile = (req, res)=>{
       
    res.send("Profile edited")
}