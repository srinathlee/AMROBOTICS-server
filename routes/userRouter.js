const express=require('express')
const router=express.Router()
const {register, login,logout,forgotPassword,resetPassword,updatePassword,userDetails,profileUpdate, getAllUsers,getUser,updateUserRole,deleteUser,wishListProduct,RemovewishListProduct,AddCartItem,RemoveCartItem} =require("../controllers/userController")
const {isAuthorized,roleAuthorize}=require("../middleware/auth")
const upload=require('../middleware/multer')


router.route("/register").post(upload.single("avatar"),register)
router.route("/login").post(login)
router.route("/logout").post(logout)  // frontend 
router.route("/forgotpassword").post(forgotPassword)
router.route("/resetpassword/:id").post(resetPassword)
router.route("/me").get(isAuthorized,userDetails)
router.route("/password/update").put(isAuthorized,updatePassword)
router.route("/me/profileupdate").put(isAuthorized,profileUpdate)
router.route("/admin/getallusers").get(isAuthorized,roleAuthorize("admin"),getAllUsers)
router.route("/admin/user/:id").get(isAuthorized,roleAuthorize("admin"),getUser)
.put(isAuthorized,roleAuthorize("admin"),updateUserRole).delete(isAuthorized,roleAuthorize("admin"),deleteUser)
// whislist routers________________
router.route("/me/wishlist/:id").post(isAuthorized,wishListProduct).delete(isAuthorized,RemovewishListProduct)
// cart routers____________________
router.route("/me/cart/:id").post(isAuthorized,AddCartItem).delete(isAuthorized,RemoveCartItem)


module.exports=router