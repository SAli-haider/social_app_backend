import express from "express";
import {addFriend,respondFriendReq} from "../controller/friends.js";
import {verifyToken} from "../middleware/tokenValidation.js"

const route = express.Router();

route.post("/addFriend", verifyToken,addFriend);
route.post("/respondReq", verifyToken,respondFriendReq);


export default route;