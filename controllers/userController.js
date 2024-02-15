const asyncHandler = require("../middleware/asynchandler");
const errorHandler = require("../utils/errorHandler");
const User = require("../models/userModel");
const sendJwt = require("../utils/jwttokenSend");
const sendEmail=require("../utils/sendEmail")
const crypto=require("crypto")
const cloudinary=require("../utils/cloudinary")
const fs=require("fs");
const { whitelist } = require("validator");


// user register
exports.register = asyncHandler(async (req, res, next) => {  
  const { name, email, password, number} = req.body;  
  // checking if file present in request
  // if(req.file==undefined){
  //   return next(new errorHandler("provide avatar", 401));
  //   }
  // uploading into cloudinary
  // const uploaded=await cloudinary(req.file)
  // const avatar={public_id:uploaded.public_id,url:uploaded.url}

  const avatar=""
  // checking user existance
  let user = await User.findOne({ email });
  if (user) {
    return next(new errorHandler("user already exist", 401));
  }
  user = await User.create({
    name,
    email,
    password,
    avatar,
    number
  });
  //sending response
  sendJwt(user, 201,"registerd successfully", res);  
});

//user login
exports.login = asyncHandler(async (req,res,next) => {
  const { email, password } = req.body;
  console.log(email,password)

  if (email == "" || password == "") {
    return next(new errorHandler("Enter Email and Password", 403));
  }
  const user = await User.findOne({ email }).select("+password");
  console.log(user)
  if (!user) {
    return next(new errorHandler("Invalid Email or Password", 403));
  }
  //conparing password
  const passwordMatch = await user.comparePassword(password);

  if (!passwordMatch) {
    return next(new errorHandler("Invalid Email or Password", 403));
  }
  //sending response
  sendJwt(user, 200,"login successfully", res);
});

// forgot password
exports.forgotPassword=asyncHandler(async(req,res,next)=>{
  const email=req.body.email
  const user=await User.findOne({email})
  if(!user){
    next(new errorHandler("user dosent exit",401))
  }
  const token=user.resetToken()
  const resetUrl=`http://localhost:5080/api/v1/resetpassword/${token}`
  const message=`your reset url is ${resetUrl} leave it if you didnt requested for it`
  await user.save({validateBeforeSave:false})
  try{
   const mailMessage= await sendEmail({
    email:user.email,
    subject:"password reset mail",
    message:message
   })
   res.status(201).json({success:true,message:"mail sent successfully",mailMessage:mailMessage})

  }
  catch(e){
    user.resetPasswordExpire=undefined;
    user.resetPasswordToken=undefined;
    await user.save({validateBeforeSave:false})
    next(new errorHandler(e.message,401))
  }
})

// reset password
exports.resetPassword=asyncHandler(async(req,res,next)=>{
  const token=req.params.id
  const hashedToken=crypto.createHash("sha256").update(token).digest("hex")
  const user=await User.findOne({resetPasswordToken:hashedToken,resetPasswordExpire:{$gt:Date.now()}})
  if(!user){
    return next(new errorHandler("Reset password is invalid or expired",400))
  }
  if(req.body.password!=req.body.confirmPassword){
    return next(new errorHandler("Password dosnt match",401))
  }
  user.password=req.body.password
  user.resetPasswordExpire=undefined
  user.resetPasswordToken=undefined
  await user.save()
  sendJwt(user,201,"reset password successfully",res)
})

// user logout
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie("jwtToken", null, {
    httpOnly:true,
    expires: new Date(Date.now()),
  });
  res.status(200).json({ success: true, message: "logout successfully" });
});

// update password
exports.updatePassword=asyncHandler(async(req,res,next)=>{
  const {password,confirmPassword,oldPassword}=req.body
  const user=await User.findById(req.user.id).select("+password")
  const passwordCheck=await user.comparePassword(oldPassword)
  if(!passwordCheck){
    return next(new errorHandler("Wrong password",400))
  }
  if(password!=confirmPassword){
    return next(new errorHandler("password dosent match",400))
  }
  user.password=password;
  await user.save()
  sendJwt(user,201,"password updated successfully",res)

})

// my details
exports.userDetails=asyncHandler(async(req,res,next)=>{
  const user=await User.findById(req.user.id)
  if(!user){
    return next(new errorHandler("Login to access this resource",400))
  }
  res.status(200).send({success:true,user})
})

// update user details
exports.profileUpdate=asyncHandler(async(req,res,next)=>{
  const userNewDetails={
    name:req.body.name,
    email:req.body.email,
    number:req.body.number
  }
  const user=await User.findByIdAndUpdate(req.user.id,userNewDetails,{new:true,runValidators:true,useFindAndModify:false})
  res.status(201).json({success:true,user})
})

// get all users---admin
exports.getAllUsers=asyncHandler(async(req,res,next)=>{
   const users=await User.find()
   res.status(200).json({success:true,users})
})

// get single user---admin
exports.getUser=asyncHandler(async(req,res,next)=>{
  const user=await User.findById(req.params.id)
  res.status(200).json({success:true,user})
})

// update user role ---admin 
exports.updateUserRole=asyncHandler(async(req,res,next)=>{
  const id=req.params.id;
  let user=await User.findById(id)
  if(!user){
    return next(new errorHandler(`user dosent exist with id ${id}`),400)
  }
  const updatedUserData={
    role:req.body.role
  }
   user=await User.findByIdAndUpdate(id,updatedUserData,{new:true,runValidators:true,useFindAndModify:false})
  res.status(201).json({success:true,user})
})

// delete user --admin
exports.deleteUser=asyncHandler(async(req,res,next)=>{
  const id=req.params.id
  const user=await User.findById(id)
  if(!user){
    return next(new errorHandler(`user dosent exist with id ${id}`),400)
  }
  const message=await User.findByIdAndDelete(id);

  res.status(200).json({success:true,message:"user deleted successfully"})
})

// whishlist products________________________________________________________________________
exports.wishListProduct=asyncHandler(async(req,res,next)=>{
  const productId=req.params.id
  const userId=req.user.id
  let user=await User.findById(userId)
  const wishList=user.wishList 
  const itemExist=wishList.find((each)=>each.product==productId)
  if(itemExist){
    return next(new errorHandler(`Product with ${productId} already wishlisted`),400) 
  }
  wishList.push({"product":productId})
  user.wishList=wishList
  await user.save({validateBeforeSave:false})
  res.status(200).json({success:true,message:"Product wishlisted successfully"})
})

// remove product form wishlist______________________________________________________________
exports.RemovewishListProduct=asyncHandler(async(req,res,next)=>{
  const productId=req.params.id
  const userId=req.user.id
  let user=await User.findById(userId)
  const wishList=user.wishList 
  const newWishlist=wishList.filter((each)=>each.product!=productId)
  user.wishList=newWishlist 
  await user.save({validateBeforeSave:false})
    res.status(200).json({success:true,message:"Product remover from Wishlist successfully"})
})

// add item to cart increase quantity if already present_____________________________________
exports.AddCartItem=asyncHandler(async(req,res,next)=>{

  const userId=req.user.id
  const productId=req.params.id 
  const user=await User.findById(userId)
  let cartDetails={
    "product":productId,
    quantity:1
  }
  const isCarted=user.cart.findIndex((each)=>each.product==productId)
  console.log(isCarted)
  if(isCarted!=-1){
  user.cart[isCarted].quantity+=1
  }
  else{
  user.cart.push(cartDetails) 
  }
  await user.save({validateBeforeSave:false})
 res.json(user.cart)
})
// remove item from cart _____________________________________
exports.RemoveCartItem=asyncHandler(async(req,res,next)=>{
  const userId=req.user.id
  const productId=req.params.id
  const user=await User.findById(userId)
  const newCart=user.cart.filter((each)=>each.product!=productId)
  user.cart=newCart 
  await user.save({validateBeforeSave:false})
 res.json(newCart)

})