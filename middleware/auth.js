const jwt=require("jsonwebtoken")
const User =require("../models/userModel")
const errorHandler=require("../utils/errorHandler")
const asyncHandler=require("../middleware/asynchandler")


exports.isAuthorized=asyncHandler(async(req,res,next)=>{
   const headers=req.headers['authorization']
   if(!headers){
    return next(new errorHandler("no jwtToken provided unauthorised ",401))
   }   
   const jwtToken=headers.split(" ")[1]
   if(!jwtToken){
    return next(new errorHandler("login to access this resource",401))
   }
   const {id}=jwt.verify(jwtToken,process.env.jwt_secret)
   const user=await User.findById(id)
   req.user=user
   next()
});


exports.roleAuthorize=(...role)=>{
    return (req,res,next)=>{
        const user=req.user.role
        if(!role.includes(user)){
        return next(new errorHandler(`the role ${user} is not allow to access this resourece`,401))
        }
        next()
    }  
}