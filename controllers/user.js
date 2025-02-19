import { createError } from "../error.js";
import Users from "../models/Users.js"

export const getAllUser = async(req,res) =>{

    const allUser = await Users.find();

    console.log("req user");
    res.status(200).json(allUser)
}

export const inviteRequest = async(req,res,next)=>{
     console.log("params")
     console.log(req.params.id);

     if(req.user.id !== req.params.id){
        try{
           
           const receiver = await Users.findByIdAndUpdate(req.params.id,{$addToSet:{inviteRequest:req.user.id}});

           res.status(200).json(receiver);

        }catch(e){
            res.status(404).json(e.message);
        }
     }else{
        next(createError(401,"u cannot invite urself"));
     }
}

export const acceptInvite = async(req,res,next) => {

    const user = await Users.findById(req.user.id);

    if(user.inviteRequest.includes(req.params.id))
    {

        try{
            const receiver = await Users.findByIdAndUpdate(req.params.id,{$addToSet:{inviteAcceptedUsers:req.user.id}})
            
            user.inviteAcceptedUsers.push(req.params.id);
            user.inviteRequest.pull(req.params.id);

            console.log("before save")
            console.log(user);
            user.save();

            res.status(200).json("success");
        }catch(e){
            res.status(404).json("failure");
        }
    }else{
        next(createError(401,"no user request"))
    }
    
}

export const removeInvite = async(req,res,next) => {
    const user = await Users.findById(req.user.id);

    try{
        if(user.inviteAcceptedUsers.includes(req.params.id)){
            await Users.findByIdAndUpdate(req.params.id,{$pull:{inviteAcceptedUsers:req.user.id}})
            user.inviteAcceptedUsers.pull(req.params.id);
            user.save()
            res.status(200).json("removed user")
        }else{
            res.status(401).json("no such users")
        }
    }catch(e){
       res.status(401).json(e.message);
    }
}