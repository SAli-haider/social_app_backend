import express from "express";
import user from "../routes/user.js"
import posts from "../routes/post.js"
import friends from "../routes/friends.js"
import comment from "../routes/comments.js"
import likes from "../routes/likes.js"
import conversation from "../routes/conversation.js"
const route = express.Router();


route.use('/auth',user)
route.use('/auth',posts)
route.use('/auth',friends)
route.use('/auth',comment)
route.use('/auth',likes)
route.use('/auth',conversation)

export default route;