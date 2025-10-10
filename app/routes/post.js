import express from "express";
import { createPost,getMyPosts,getAllPost,createComment,toggleLike,deletePost} from "../controller/post.js";
import {verifyToken} from "../middleware/tokenValidation.js"

const route = express.Router();

route.post("/createPost", verifyToken,createPost);
route.get("/getMyPosts", verifyToken,getMyPosts);
 route.get("/getAllPosts", verifyToken,getAllPost);
route.post("/createComment", verifyToken,createComment);
route.post("/likePost", verifyToken,toggleLike);
route.post("/deletePost", verifyToken,deletePost);

export default route;


//getAllPost, getMyPosts,getPostComments 