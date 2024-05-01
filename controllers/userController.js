const asyncHandler = require("../middleware/asynchandler");
const errorHandler = require("../utils/errorHandler");
const User = require("../models/userModel");
const Product=require("../models/productModels")
const sendJwt = require("../utils/jwttokenSend");
const sendEmail=require("../utils/sendEmail")
const crypto=require("crypto")
const cloudinary=require("../utils/cloudinary")
const fs=require("fs");
const { whitelist } = require("validator");
const { execPath } = require("process");



// user register
exports.register = asyncHandler(async (req, res, next) => {  
  const { name, email, password, number,address} = req.body;  
  console.log(address)
  // checking if file present in request
  // if(req.file==undefined){
  //   return next(new errorHandler("provide avatar", 401));~
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
    number,
    address
  });
  //sending response
  sendJwt(user, 201,"registerd successfully", res);  
});

//user login
exports.login = asyncHandler(async (req,res,next) => {

  const { email, password } = req.body;

  if (email == "" || password == "") {
    return next(new errorHandler("Enter Email and Password", 403));
  }
  const user = await User.findOne({ email }).select("+password");
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
  // const resetUrl=`http://localhost:5080/api/v1/resetpassword/${token}`
  const resetUrl=`http://127.0.0.1:5173/resetpassword/${token}`
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



exports.profileUpdate = asyncHandler(async (req, res, next) => {
  const { name, email, number, address } = req.body;

  const user = await User.findById(req.user.id);

  if (!name && !email && !number) {
    // Only update the address if name, email, and number are not provided
    if (address) {
      user.addresses.push(address);
      await user.save();
      res.status(201).json({ success: true, user });
    } else {
      res.status(400).json({ success: false, message: "Address is required." });
    }
  } else {
    // Update name, email, and number along with the address
    user.name = name || user.name;
    user.email = email || user.email;
    user.number = number || user.number;
    if (address) {
      user.addresses.push(address);
    }
    await user.save();
    res.status(201).json({ success: true, user });
  }
});




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
  console.log("wishlll")
  const productId=req.params.id
  const userId=req.user.id
  let user=await User.findById(userId)
  const wishList=user.wishList 
  console.log(wishList)
  const itemExist=wishList.find((each)=>each.product==productId)

  if(itemExist){
  const newWishlist=wishList.filter((each)=>each.product!=productId)
  user.wishList=newWishlist 
  await user.save({validateBeforeSave:false})
  return res.status(200).json({success:true,message:"Product removed from Wishlist successfully"})
    // return next(new errorHandler(`Product with ${productId} already wishlisted`),400) 
  }
  wishList.push({"product":productId})
  console.log(wishList)
  user.wishList=wishList
  await user.save({validateBeforeSave:false})
  return res.status(200).json({success:true,message:"Product wishlisted successfully"})
})

// remove product form wishlist______________________________________________________________
exports.RemovewishListProduct=asyncHandler(async(req,res,next)=>{
  const productId=req.params.id
  console.log(productId)
  const userId=req.user.id
  let user=await User.findById(userId)
  const wishList=user.wishList 
  const newWishlist=wishList.filter((each)=>each.product!=productId)
  user.wishList=newWishlist 
  await user.save({validateBeforeSave:false})
  res.status(200).json({success:true,message:"Product remover from Wishlist successfully"})
})

// get all Wishlist details__________________
exports.getWishlist=asyncHandler(async(req,res,next)=>{
  const userId=req.user.id
  const user=await User.findOne({_id:userId},{wishList:1,_id:0});
  console.log("wishlistData")
  console.log(user)

  const wishlistData = await Promise.all(
    user.wishList.map(async(eachItem)=>{
      console.log(eachItem)
      const product = await Product.findOne({_id:eachItem.product},{name:1,images:1,price:1,stock:1})
      // console.log(product)
      const item = {name:product.name,images:product.images,price:product.price,id:product.id,stock:product.stock}
      // console.log(item)
      return item
    })
  )

res.status(200).json({message:"wishlistData",success:true,data:wishlistData})
})

// empty the wishlist_______________________________________
exports.deleteWishlist=asyncHandler(async(req,res,next)=>{
  const userId=req.user.id
  const user=await User.findById(userId)
  user.wishList=[]
  user.save({validateBeforeSave:false})
  res.status(200).json({success:true,message:"Wishlist is empty successfully"})
})

// add item to cart increase quantity if already present_____________________________________
exports.AddCartItem=asyncHandler(async(req,res,next)=>{
  const userId=req.user.id
  const productId=req.params.id 
  const quantity=req.body.quantity
  const user=await User.findById(userId)
  const product=await Product.findById(productId)
 
  let cartDetails={
    "product":productId,
    quantity:quantity
    }

  const isCarted=user.cart.findIndex((each)=>each.product==productId)
  if(isCarted!=-1){
  user.cart[isCarted].quantity+=1
  }
  else{
  user.cart.push(cartDetails) 
  }
  await user.save({validateBeforeSave:false})
 res.json({success:true,message:"product added to cart successfully"})
})
// remove item from cart _____________________________________
exports.RemoveCartItem=asyncHandler(async(req,res,next)=>{
  const userId=req.user.id
  const {id}=req.params 
  console.log(id)
  const user=await User.findById(userId)
  const newCart=user.cart.filter((each)=>each.product!=id)         
  user.cart=newCart[0] 
  await user.save({validateBeforeSave:false})
 res.status(200).json({success:true,message:"item is removed form cart successfully"})
})

// get all cart details__________________
exports.getCartDetails=asyncHandler(async(req,res,next)=>{
  const userId=req.user.id
  const user=await User.findOne({_id:userId},{cart:1});
  const cartData = await Promise.all(
    user.cart.map(async(cartItem)=>{
      const product = await Product.findOne({_id:cartItem.product},{name:1,images:1,price:1})
      product.quantity=cartItem.quantity
      const item = {name:product.name,images:product.images,price:product.price,quantity:cartItem.quantity,id:product.id}
      return item
    })
  )

res.status(200).json({success:true,data:cartData})
})

// increment cart item quantity________________________________
exports.updateCartItem=asyncHandler(async(req,res,next)=>{
  const userId=req.user.id
  const {id}=req.params
  const {operation}=req.body
  console.log(id,operation)
  console.log(operation)
  const user=await User.findById(userId)

  const isCarted=user.cart.findIndex((each)=>each.product==id)
  console.log(isCarted,"iscarted")
  if(operation=="inc"){
  user.cart[isCarted].quantity+=1
  }
  else{
  if(user.cart[isCarted].quantity<=0)
  user.cart[isCarted].quantity=0
  else
  user.cart[isCarted].quantity-=1
  }
  await user.save({validateBeforeSave:false})
  res.status(200).json({success:true,message:"cart item quantity updated successfully"})

})

// empty the cart________________________________
exports.deleteCart=asyncHandler(async(req,res,next)=>{
  const userId=req.user.id
  const user=await User.findById(userId)
  user.cart=[]
  user.save({validateBeforeSave:false})
  res.status(200).json({success:true,message:"cart is empty successfully"})
})