import express from "express";
import dotenv from "dotenv";
// To connect mongodb atlas 
import { DBconnection } from "./config/db.js";

import teacherRouters from "./routers/teacher.js";
import usersRouters from "./routers/users.js"

dotenv.config();
DBconnection(); // 🔥 Atlas connection

const app = express();
app.use(express.json());

app.use("/api/users", usersRouters);
app.use("/api/teacher",teacherRouters);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
