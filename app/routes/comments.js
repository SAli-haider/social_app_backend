import express from "express";
import { createComment,getPostComments,deleteComment,commentReply} from "../controller/comments.js";
import {verifyToken} from "../middleware/tokenValidation.js"

const route = express.Router();


route.post("/createComment", verifyToken,createComment);
route.get("/getPostComments", verifyToken,getPostComments);
route.post("/deleteComment", verifyToken,deleteComment);
route.post("/commentReply", verifyToken,commentReply);

export default route;