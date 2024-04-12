const fs=require("fs")
const cloudinary=require("cloudinary")


cloudinary.config({ 
    cloud_name: process.env.cloud_name, 
    api_key: process.env.api_key, 
    api_secret: process.env.api_secret
  });

  const uploadFile=async(files)=>{
    try{
      
      if(!files)
      return null
 
      const response=await cloudinary.uploader.upload(files.path,{resource_type:"auto"})
      return response
    }
    catch(e){
        return e
    }

  }

module.exports=uploadFile