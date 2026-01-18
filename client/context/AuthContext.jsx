import { Children, createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {io} from 'socket.io-client'


const backendUrl=import.meta.env.VITE_BACKEND_URL
axios.defaults.baseURL=backendUrl

//createContext() is used to create a global state container that any component in your React app can access — without prop drilling.

//AuthContext is the name of container.This will be used to share authentication-related data (like user, token, isLoggedIn) throughout your app.


export const AuthContext = createContext(); 


// This is a Context Provider Component — it wraps your app (or part of it) and provides the context value.
export const AuthProvider = ({children})=>{

    const [token,setToken]=useState(localStorage.getItem("token"));
    const [authUser,setAuthUser]=useState([]);
    const [onlineUsers,setOnlineUsers]=useState([]);
    const [socket,setSocket]=useState(null)

    //Check if user is authenticate and if so, set the user dat and connect the socket

    const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check");
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      } else {
        handleLogoutDueToFailure();
      }
    } catch (error) {
      handleLogoutDueToFailure();
      toast.error("Session expired. Please login again.");
    }
  };

  const handleLogoutDueToFailure = () => {
    setAuthUser(null);
    setToken(null);
    setOnlineUsers([]);
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["token"];
  };

    //Login function to handle user authentication and socket connnection
    const login = async (state,credentials)=>{
        try {
            const {data} = await axios.post(`/api/auth/${state}`,credentials);
            if(data.success){
                setAuthUser(data.userData);
                connectSocket(data.userData);
                axios.defaults.headers.common["token"] = data.token;
                setToken(data.token);
                localStorage.setItem("token",data.token);
                toast.success(data.message);
            }else{
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    //Logout function to handle user logout and socket disconnection
    const logout = async ()=>{
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUsers([]);
        axios.defaults.headers.common["token"]=null;
        toast.success("Logged out successfully");
        socket.disconnect();
    }

    //Update profile funtion to handle user profile updates
    const updateProfile = async(body)=>{
        try {
            const {data} = await axios.put("/api/auth/update-profile",body);
            if(data.success){
                setAuthUser(data.user);
                toast.success("Profile Updated Successfully");
            }
        } catch (error) {
            toast.error(error.message);
        }
    }




    //Connect socket funtion to handle socket connection and online users updates
    const connectSocket = (userData)=>{
        if(!userData || socket?.connected) return;
        const newSocket = io(backendUrl,{
            query:{
                userId:userData._id,
            }
        });
        newSocket.connect();
        setSocket(newSocket);

        newSocket.on("getOnlineUsers",(userIds)=>{
            setOnlineUsers(userIds);
        })
    }

    useEffect(()=>{
        if(token){
            //Globally attach token to all Axios requests
            axios.defaults.headers.common["token"]=token
        }
        checkAuth()
    },[])

    const value = {
        axios,
        authUser,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile
        
    }
    return (
        <AuthContext.Provider value={value}>
            {/* {children} means: whatever components you wrap inside <AuthProvider> will have access to this AuthContext. */}
            {children}
        </AuthContext.Provider>
    )
}


// createContext()   --- 	Creates the shared data container
// AuthProvider ----  Wraps components & provides shared data
// value ---	Holds global data & functions like login/logout
// children ---	The nested components inside the provider