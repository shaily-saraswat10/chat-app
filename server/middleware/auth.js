//Middleware to protected routes

import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectRoute = async(req,res,next)=>{
    try {
        //to extract a token from the request headers.
        const token = req.headers.token;

        //to verify and decode a JWT (JSON Web Token) using a secret key.
        const decode = jwt.verify(token,process.env.JWT_SECRET);

        // to fetch a user from the database using their ID,
        const user = await User.findById(decode.userId).select("-password");

        if(!user){
        return res.json({success:false,message:"User Not Found"});
        }
        
        // If user is found, attach the user object to req.user.
        req.user=user;
        next();
    } catch (error) {
        console.log(error.message)
        res.json({success:false,message:error.message});
        
    }
}