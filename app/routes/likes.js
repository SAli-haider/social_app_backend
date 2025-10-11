import express from "express";
import {toggleLike,getPostLikes} from "../controller/likes.js";
import {verifyToken} from "../middleware/tokenValidation.js"

const route = express.Router();

route.post("/likePost", verifyToken,toggleLike);
route.get("/getPostLikes", verifyToken,getPostLikes);

export default route;

