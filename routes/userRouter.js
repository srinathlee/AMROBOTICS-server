const express=require('express')
const router=express.Router()
const {register, login,logout,forgotPassword,resetPassword,updatePassword,userDetails,profileUpdate, getAllUsers,getUser,updateUserRole,deleteUser} =require("../controllers/userController")
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


module.exports=router