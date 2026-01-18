//This imports the Cloudinary Node.js SDK, version 2 syntax (v2 is more modern)
import {v2 as cloudinary} from 'cloudinary'


//This configuration code is used to connect your backend to your Cloudinary account so you can upload images, videos, or other media to the cloud.

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,
})

export default cloudinary