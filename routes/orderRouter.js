const {initPayment,createOrder,getSingleOrder,getLoggedInOrders,getAllOrders,updateOrder,deleteOrder,paymentConform}=require("../controllers/ordersController")
const {isAuthorized,roleAuthorize}=require("../middleware/auth")
const Router=require("express").Router()

Router.route("/initpayment").post(initPayment)
Router.route("/order/new").post(paymentConform,createOrder)
Router.route("/order/:id").get(isAuthorized,getSingleOrder)
Router.route("/orders/me").get(isAuthorized,getLoggedInOrders)
Router.route("/admin/orders").get(isAuthorized,roleAuthorize("admin"),getAllOrders)
Router.route("/admin/orders/:id").put(isAuthorized,roleAuthorize("admin"),updateOrder).delete(isAuthorized,roleAuthorize("admin"),deleteOrder)

module.exports=Router