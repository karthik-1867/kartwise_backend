import express from "express"
import mongoose from "mongoose";
import dotenv from "dotenv";
import users from "./routes/users.js";
import expenseGroup from "./routes/createExpenseGroup.js"
import expense from "./routes/createExpenseInfo.js"
import notification from "./routes/notification.js"
import cookieParser from "cookie-parser";
import cors from "cors"

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

// app.use(cors({
//     origin: 'http://localhost:3000', // Your React app URL
//     credentials: true, // Allow cookies to be sent
//   }));

app.use(cors());
app.set("trust proxy", 1);


  app.use(cors({
    origin: 'http://localhost:3000', // Frontend URL
    methods: ['GET', 'POST', 'DELETE'], // Allow both GET and POST methods
    credentials: true, // Allow sending credentials (cookies, etc)
    SameSite:None
  }));
  

app.use(cookieParser())
app.use(express.json())
app.use("/user",users)
app.use("/ExpenseGroup",expenseGroup)
app.use("/expense",expense)
app.use("/notification",notification)


app.use((err,req,res,next)=>{

    const status = err.status || 500;
    const message = err.message || "something went wrong";
    return res.status(status).json({
      success:false,
      status,
      message
    })
})