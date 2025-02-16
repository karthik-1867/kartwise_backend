import express from "express"
import mongoose from "mongoose";
import dotenv from "dotenv";
import users from "./routes/users.js";
import cookieParser from "cookie-parser";

dotenv.config()

const connect = () => {
    mongoose.connect(process.env.MONGO_URL).then(()=>{
        console.log("connected to mongodb")
    }).catch((e)=>{
        console.log(e);
    })
}

const app = express();

app.listen(8800,()=>{
    console.log("connected")
    connect();
})

app.use(cookieParser())
app.use(express.json())
app.use("/user",users)


app.use((err,req,res,next)=>{

    const status = err.status || 500;
    const message = err.message || "something went wrong";
    return res.status(status).json({
      success:false,
      status,
      message
    })
})