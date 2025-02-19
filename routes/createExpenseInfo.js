import express from "express"

import { verifyToken } from "../verifiyToken.js";
import createExpenseInfo from "../models/createExpenseInfo.js";
import Users from "../models/Users.js";
import CreateExpenseGroup from "../models/CreateExpenseFroup.js"
import { createError } from "../error.js";

const router = express.Router();


router.post("/createExpenseDetails",verifyToken,async(req,res,next)=>{
   
    try{

        const expensegroup = await CreateExpenseGroup.findById(req.body.expenseGroupId);
        console.log(expensegroup)
        
        const ownerDetail = await Users.findOne({name:req.body.owner});
        req.body.users = req.body.users.map((i)=>(
            i.id == ownerDetail.id ? {... i, "paidBack": i.expense,"owner":true,"status":"paid"} : {... i, "paidBack":0,"owner":false,"status":"pending"}
        ))
        
        req.body.users = req.body.users.filter(i=>expensegroup.members.includes(i.id))
        console.log(req.body.users)
        const val = (req.body.users.reduce((acc,cur)=>(acc+Number(cur.expense)),0))-(req.body.users.filter((i)=>i.owner==true)[0].expense)
        const ownerPaidBack = req.body.users.filter((i)=>i.owner==true)[0].expense

        console.log("total")
        console.log(val);
        req.body = {...req.body,"paid":val,"ownerReceived":0,"ownerId":ownerDetail.id}

        console.log("owner id")
        console.log(ownerDetail.id);

        const expense = new createExpenseInfo(req.body);
        expense.save();

        const groupId = req.body.users.map((i)=>i.id)

        await CreateExpenseGroup.findByIdAndUpdate(expensegroup.id,{$inc:{spent:val}})

        const result = await Users.updateMany(
            { _id: { $in: [...groupId] } }, // Match users with the given userIds
            { $push: {createExpenseInfo:expense.id},
              $inc:{expenditure:val}
            } // Apply the update
        );

        
        await Users.findByIdAndUpdate(ownerDetail.id,{
            $inc:{contributed:val,paidBack:ownerPaidBack}
        })

        res.status(200).json(result);
    }catch(e){
        res.status(404).json(e.message)
    }
})

router.get("/getExpenseDetails/:id",verifyToken,async(req,res,next)=>{

    try{

        const groupDetail = await createExpenseInfo.findById(req.params.id)
        res.status(200).json(groupDetail);
    }catch(e){
        res.status(401).json(e);
    }
})

router.post("/updateExpenseDetails/:id",verifyToken,async(req,res,next)=>{
    try{

        console.log(req.params.id)

        const val = req.body.users.reduce((acc,cur)=>(acc+cur.paidBack),0);
        const currentInfoStatus = await createExpenseInfo.findById(req.params.id);

        if(currentInfoStatus.ownerId !== req.user.id) return next(createError(403,"Only one who paid for the group can update this"));
        for (let current_input of req.body.users){
            const i = currentInfoStatus.users.filter((prev)=>prev.id===current_input.id && (prev.paidBack+current_input.paidBack <= prev.expense));
            if(i.length==0){
                return next(createError(403,"paying more then expense"))
            }
        }


        const ownerDetail = await Users.findOne({name:currentInfoStatus.owner});
        await Users.findByIdAndUpdate(ownerDetail.id,{
            $inc:{recived:val}
        })

        console.log("proceeded")

        //if putting map inside for loop then always ensure list is updated at the end by creating copy
        for (let current_input of currentInfoStatus.users){
            //we are trying to mutate but thats not returing updated things
            // req.body.users = req.body.users.map((i)=>(
            //     (current_input.id == i.id && current_input.paidBack+i.paidBack == current_input.expense) ? {...i,"status":"paid"} : current_input.expense-current_input.paidBack > 0 ? {...i,"status":"partially paid"} : i
            // ))
            req.body.users = req.body.users.map((user) => {
                if (current_input.id === user.id) {
                  
                  if (current_input.paidBack + user.paidBack === current_input.expense) {
                    return { ...user, status: "paid" };
                  }

                  else if (current_input.paidBack + user.paidBack > 0) {
                    return { ...user, status: "partially paid" };
                  }
                }
                
                return user;
              });
        }

        console.log(currentInfoStatus.ownerId)
        console.log(req.user.id)
        
        
        console.log(currentInfoStatus)
        if(currentInfoStatus?.ownerReceived<currentInfoStatus.paid){
            const members = currentInfoStatus.users.map((i)=>i.id);
            console.log(members)
            
            const updated_val = val + currentInfoStatus?.ownerReceived
            await Users.updateMany(
                { _id: { $in: [...members] } }, 
                { $inc:{recoveredExpenditure:val}
                }
            );
            currentInfoStatus.ownerReceived = updated_val;

            await CreateExpenseGroup.findByIdAndUpdate(currentInfoStatus.expenseGroupId,{$inc:{received:val}})
        }
        if(currentInfoStatus?.paid-currentInfoStatus?.ownerReceived == 0) currentInfoStatus.allSettled = "allSettled"

        for (let user of req.body.users) {
            console.log("user")
            console.log(user);

            if(req.user.id == user.id && (user.status=="pending" || user.status=="partially paid")){
                await Users.findByIdAndUpdate(req.user.id,{
                    $inc:{paidBack:user.paidBack}
                })
            }

            const result = await createExpenseInfo.updateOne(
              { _id: req.params.id },
              {
                $set: { 
                  "users.$[elem].status" : user.status
                },
                $inc:{

                    "users.$[elem].paidBack": user.paidBack
                }
              },
              {
                arrayFilters: [
                  { "elem.id": user.id }, // Update friend with this specific ID
                ],
              }
            );
        }



        await currentInfoStatus.save();

        res.status(200).json(currentInfoStatus);
    }catch(e){
        res.status(401).json(e.message)
    }
})


router.delete("/deleteExpenseDetails/:id",verifyToken,async(req,res,next)=>{
    
    const expense = await createExpenseInfo.findById(req.params.id);

    const expenseMembers = expense.users.map((i)=>i.id);
    const result = await Users.updateMany(
        { _id: { $in: [...expenseMembers] } }, // Match users with the given userIds
        { $pull: {createExpenseInfo:req.params.id},
          $set :{expenditure:0,recoveredExpenditure:0,paidBack:0,recived:0,contributed:0}
        }
    );

    await createExpenseInfo.findByIdAndDelete(req.params.id)
    res.status(200).json("deleted")

})


export default router;