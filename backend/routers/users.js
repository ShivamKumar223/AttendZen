import express from "express";

// Import all required functions
import {showLoginPage, handleUserLogin, handleUserLogout,
      handleChangePassword, handleResetPassword, updateProfile, editProfile
} from "../controllers/user.js"

const router = express.Router();

// To show login page
router.get("/", showLoginPage)

// To handle user login
router.get("/login", handleUserLogin);

// To handle user logout
router.get("/logout", handleUserLogout);

// To change password
router.patch("/change/password", handleChangePassword);

// To reset password
router.patch("/forget/password", handleResetPassword);

// To update user profile
router.post("/profile/update", updateProfile);

// To edit user profile
router.patch("/profile/edit", editProfile);

export default router;