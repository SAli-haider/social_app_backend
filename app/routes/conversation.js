import express from "express";
import {createConversation,getAllConversation} from "../controller/conversation.js";
import {verifyToken} from "../middleware/tokenValidation.js"

const route = express.Router();

route.post("/createConversation", verifyToken,createConversation);
route.get("/getAllConversation", verifyToken,getAllConversation);

export default route;