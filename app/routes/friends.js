import express from "express";
import {addFriend,respondFriendReq,getFriendsSuggestions,getAllPendingRequests} from "../controller/friends.js";
import {verifyToken} from "../middleware/tokenValidation.js"

const route = express.Router();

route.post("/addFriend", verifyToken,addFriend);
route.post("/respondReq", verifyToken,respondFriendReq);
route.get("/getFriendSuggestions", verifyToken,getFriendsSuggestions);
route.get("/getAllPendingRequests", verifyToken,getAllPendingRequests);


export default route;