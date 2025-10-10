import express from "express";
import { registerUser, loginUser } from "../controller/auth.js";

const route = express.Router();

route.post("/register", registerUser);
route.post("/login", loginUser);

export default route;