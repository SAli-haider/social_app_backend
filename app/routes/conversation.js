import express from "express";
import {createConversation,getAllConversation,getAllMessage,sendMessage,deleteMessage,deleteConversation} from "../controller/conversation.js";
import {verifyToken} from "../middleware/tokenValidation.js"

const route = express.Router();

route.post("/createConversation", verifyToken,createConversation);
route.get("/getAllConversation", verifyToken,getAllConversation);
route.get("/getAllMessage", verifyToken,getAllMessage);
route.post("/sendMessage", verifyToken,sendMessage);
route.post("/deleteMessage", verifyToken,deleteMessage);
route.post("/deleteConversation", verifyToken,deleteConversation);

export default route;