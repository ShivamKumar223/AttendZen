import mongoose from "mongoose";

export const DBconnection = async ()=>{
  
    try{
    await mongoose.connect(process.env.ATLAS_URL);
    console.log("Database(Atlas) connected successfuly")
}catch(error){
       console.log("Database connection error : ",error)
       process.exit(1);
}

}
