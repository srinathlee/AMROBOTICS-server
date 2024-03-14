const express=require("express")
const router=express.Router()
const {getAllProducts,createProduct,updataProduct, deleteProduct,getProduct,createReview,getAllReviews,deleteReview}=require("../controllers/productsController")
const {isAuthorized,roleAuthorize}=require("../middleware/auth")


router.route("/products").post(getAllProducts)
router.route("/product/new").post(isAuthorized,roleAuthorize("admin"),createProduct)
router.route("/product/:id").put(isAuthorized,roleAuthorize("admin"),updataProduct)
.delete(isAuthorized,roleAuthorize("admin"),deleteProduct)
router.route("/product/:id").get(getProduct)
router.route("/review").put(isAuthorized,createReview)
router.route("/reviews").get(getAllReviews).delete(isAuthorized,deleteReview)


module.exports=router