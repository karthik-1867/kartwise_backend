import express from "express"
import { acceptInvite, getAllUser, inviteRequest, removeInvite, removeInviteRequest } from "../controllers/user.js";
import { signin, signup } from "../controllers/auth.js";
import { verifyToken } from "../verifiyToken.js";

const router = express.Router();

router.post("/signup",signup);

router.post("/signin",signin);

router.get("/getAllUser",verifyToken,getAllUser);

router.post("/inviteRequest/:id",verifyToken,inviteRequest);

router.post("/acceptInvite/:id",verifyToken,acceptInvite);

router.post("/removeInvitedUser/:id",verifyToken,removeInvite)

router.post("/removeInviteRequest/:id",verifyToken,removeInviteRequest)

export default router;
 