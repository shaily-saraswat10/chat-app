import User from "../models/User.js";
import Message from "../models/Message.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";


//Get all users except the logged in user in sidebar (searching Techinque)
export const getUserForSideBar= async (req,res)=>{
    try {
        const userId=req.user._id; 
        const filteredUsers = await User.find({_id:{$ne:userId}}).select("-password");

        //count number of message not seen
        const unseenMessages= {}
        const promises = filteredUsers.map(async (user)=>{
            //user._id : The user from filteredUsers
            // UserId : The logged-in user's ID (from req.user._id)
            const messages = await Message.find({senderId:user._id,receiverId:userId, seen:false});
            //“Get all unread messages where the other user (user._id) is the sender and the current logged-in user (userId) is the receiver.”
            if(messages.length > 0){
                unseenMessages[user._id]=messages.length
            }
        })
        //Kyunki map() me async ka use hua, humein Promise.all() lagana padega taaki sabhi queries complete ho jayein before response send ho.

        //Ye line wait karti hai jab tak saare users ke liye queries complete na ho jaayein.
        await Promise.all(promises)
        res.json({success:true,users:filteredUsers,unseenMessages})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message});
    }
}


// Get all messages for selected user 
export const getMessages = async (req,res)=>{
    try {
        //Extract id from req.params and rename it to selectedUserId.
        const {id:selectedUserId}=req.params;
        //Extract logged-in user's Id(mera)
        const myId=req.user._id;

        const messages = await Message.find({
            $or:[
                {senderId:myId,receiverId:selectedUserId},
                {senderId:selectedUserId,receiverId:myId}
            ]
        })

        //mark message as read
        await Message.updateMany({senderId:selectedUserId, receiverId:myId},
        {seen:true});

        res.json({success:true,messages})
        
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message});
    }
}

// api to mark message as seen using message id
export const markMessageAsSeen = async (req,res)=>{
    try {
        const {id}=req.params;
        await Message.findByIdAndUpdate(id,{seen:true});
        res.json({success:true})
        
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message});
    }
}

// Send message to selected User

export const sendMessage = async (req,res)=>{
    try {
        const {text,image}=req.body;
        const receiverId=req.params.id;
        const senderId = req.user._id;
        
        //add to cloudinary
        let imageUrl;
        if(image){
           const uploadResponse = await cloudinary.uploader.upload(image)
           imageUrl=uploadResponse.secure_url; // fetching the url from cloudinary
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image:imageUrl
        })

        //Emit the new message to receivers socket
        const receiverSocketId = userSocketMap[receiverId];
        if(receiverId){
            io.to(receiverSocketId).emit("newMessage",newMessage);
        }

        res.json({success:true,newMessage});
        //If we want to instantly send to other and display instantly , we use Socket.io


    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message});
    }
}