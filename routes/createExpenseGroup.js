import express from "express"
import CreateExpenseFroup from "../models/CreateExpenseFroup.js";
import { verifyToken } from "../verifiyToken.js";
import Users from "../models/Users.js";
import { createError } from "../error.js";
const router = express.Router();

router.post("/createGroup",verifyToken,async(req,res)=>{
    
    try{
        const users = await Users.findById(req.user.id)
        req.body.members = req.body.members.filter(id => users.inviteAcceptedUsers.includes(id));
        req.body.members = [... req.body.members, req.user.id]
        req.body.groupOwner = req.user.id;
        console.log(users)
        const group = new CreateExpenseFroup(req.body)

        await group.save();
        
        const result = await Users.updateMany(
            { _id: { $in: [...group.members] } }, // Match users with the given userIds
            { $push: {createExpenseGroup:group.id}} // Apply the update
          )


        console.log("final result")
          res.status(200).json(result);
    }catch(e){
        res.status(401).json(e.message);
    }
   
})

router.get("/getExpenseGroup/:id",verifyToken,async(req,res)=>{
    
    try{
        const groups = await CreateExpenseFroup.findById(req.params.id)

        res.status(200).json(groups);

    }catch(e){
        res.status(401).json(e.message);
    }
   
})

router.post("/updateExpenseGroup/:id",verifyToken,async(req,res,next)=>{
    try{
        const update = await CreateExpenseFroup.findById(req.params.id);
        
        const updateFields = req.body;

        if(update.groupOwner != req.user.id) return next(createError(403,"u cannot update, only group owner can update"))

        for (let key in updateFields) {
            if (updateFields.hasOwnProperty(key)) {
                update[key] = updateFields[key];
            }
        }

        update.save()

        res.status(200).json(update)
    }catch(e){
        res.status(401).json(e.message);
    }
})

router.post("/addOrDeleteMembers/:id",verifyToken,async(req,res,next)=>{
    try{


        const currentExpenseGroup = await CreateExpenseFroup.findById(req.params.id);
        const user = await Users.findById(req.user.id);

        if(currentExpenseGroup.groupOwner != req.user.id) return next(createError(403,"u cannot update, only group owner can update"))

        console.log(currentExpenseGroup)
        if(req.body.operation == 1){
            console.log("add Member")
            if(!currentExpenseGroup.members.includes(req.body.member) && user.inviteAcceptedUsers.includes(req.body.member)){
            currentExpenseGroup.members.push(req.body.member)
            await currentExpenseGroup.save()
            }
            res.status(200).json(currentExpenseGroup)
        }else{
            
            if(currentExpenseGroup.members.includes(req.body.member)){
                currentExpenseGroup.members.pull(req.body.member)
                await currentExpenseGroup.save()
            }
            res.status(200).json(currentExpenseGroup)
        }
    }catch(e){
       res.status(401).json(e.message)
    }
})

router.delete("/deleteExpenseGroup/:id",verifyToken,async(req,res,next)=>{
    try{
        const update = await CreateExpenseFroup.findById(req.params.id);
        
        if(update.groupOwner !== req.user.id) return next(createError(403,"only group owner can delete the group"))

        const members = update.members
        console.log(update)

        //delete is only avail in mongo db not on document

        //await update.delete();
         
        // "update.remove is not a function" occurs because remove() is not available on the document instance in newer versions of Mongoose (starting from Mongoose 6.x). Mongoose has deprecated the remove() method on document instances and suggests using deleteOne() or findByIdAndDelete() instead.
        //await update.remove();


        await CreateExpenseFroup.deleteOne({ _id: req.params.id });

        const result = await Users.updateMany(
            { _id: { $in: [... members] } }, // Match users with the given userIds
            { $pull: {createExpenseGroup:req.params.id} } // Apply the update
        );

         
        res.status(200).json("deleted")
    }catch(e){
        res.status(401).json(e.message);
    }
})

export default router;
