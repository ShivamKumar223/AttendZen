import express from "express";
import dotenv from "dotenv";
// To connect mongodb atlas 
import { DBconnection } from "./config/db.js";

import usersRouters from "./routers/users.js";
import teacherRouters from "./routers/teacher.js";
import studentRouter from "./routers/student.js";

dotenv.config();
DBconnection(); // 🔥 Atlas connection

const app = express();
app.use(express.json());                             //JSON format ke data ko parse karta hai
app.use(express.urlencoded({ extended: false }));     //HTML form se aane wale data ko parse karta hai

app.use("/api/users", usersRouters);
app.use("/api/teacher", teacherRouters);
app.use("/api/student", studentRouter)



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
