import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name:{
        type:String,
        require:true,
        unique:true
    },
    email:{
        type:String,
        require:true,
        unique:true
    },
    password:{
        type:String
    },
    profilePicture:{
        type:String
    },
    inviteRequest:{
        type:Array,
        default:[]
    },
    inviteAcceptedUsers:{
        type:Array,
        default:[]
    },
    createExpenseGroup:{
        type:Array,
        default:[]
    },
    createExpenseInfo:{
        type:Array,
        default:[]
    },
    expenditure:{
        type:Number,
        default:0
    },
    recoveredExpenditure:{
        type:Number,
        default:0
    },
    contributed:{
        type:Number,
        default:0
    },
    recived:{
        type:Number,
        default:0
    },
    paidBack:{
        type:Number,
        default:0
    }
},{timestamps:true})

export default mongoose.model("User",UserSchema)