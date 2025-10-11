import express from "express";
import { createPost,getMyPosts,getAllPost,deletePost} from "../controller/post.js";
import {verifyToken} from "../middleware/tokenValidation.js"

const route = express.Router();

route.post("/createPost", verifyToken,createPost);
route.get("/getMyPosts", verifyToken,getMyPosts);
 route.get("/getAllPosts", verifyToken,getAllPost);
route.post("/deletePost", verifyToken,deletePost);

export default route;

