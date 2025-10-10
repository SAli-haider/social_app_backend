import express from "express";
import user from "../routes/user.js"
import posts from "../routes/post.js"
import friends from "../routes/friends.js"
const route = express.Router();


route.use('/auth',user)
route.use('/auth',posts)
route.use('/auth',friends)

export default route;