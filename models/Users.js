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
    }
},{timestamps:true})

export default mongoose.model("User",UserSchema)