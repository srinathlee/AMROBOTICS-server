const Order=require("../models/ordersModel")
const Product=require("../models/productModels")
const errorHandler = require("../utils/errorHandler");
const asyncHandler = require("../middleware/asynchandler");
const isAuthorized = require("../middleware/auth");
const payment=require("../server")



// creating order
exports.createOrder=asyncHandler(async(req,res,next)=>{
    // const{shippingInfo,orderItems,itemsPrice,taxPrice,shippingPrice,totalPrice,paymentInfo}=req.body;

    const shippingInfo={
    address:"bijwaram",
    country:"india",
    state:"talangana",
    city:"gadwal",
    mobile:9988776655
   }

  const orderItems=[{
   name:"product1",
   quantity:1,
   images:"sampleimage",
   price:"122",
   product:"65561daaa7406f78570f5e18"
   }]

   const itemsPrice=100
   const taxPrice=10
   const shippingPrice=20
   const totalPrice=130
   const orderStatus="processing.."
   const userId="65959e5e59de3858540259ec"

    const pay_res=await payment.instance.orders.create({
        amount:totalPrice*100,
        currency: "INR"
        })
    
    const order=await Order.create({
        shippingInfo,
        orderItems,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        user:userId
    })

    res.status(200).json({success:true,message:"order initiated",paymentDetails:pay_res,order})
  })

//   payment conformation
exports.paymentConform=asyncHandler(async(req,res,next)=>{
    console.log(req)
res.redirect("http://localhost:3000/success/")
})



// get single order
exports.getSingleOrder=asyncHandler(async(req,res,next)=>{
    const id=req.params.id 
    const order=await Order.findById(id)
    if(!order){
        return next(new errorHandler("order not found",400))
    }
    res.status(200).json({success:true,order})
})

// get loggedin user orders
exports.getLoggedInOrders=asyncHandler(async(req,res,next)=>{
    const orders=await Order.find({user:req.user.id})
    res.status(200).json({success:true,orders})
})

// get all  orders  --admin
exports.getAllOrders=asyncHandler(async(req,res,next)=>{
    const orders=await Order.find()
    let totalAmount=0
    orders.forEach((order)=>{
        totalAmount+=order.totalPrice
    })
    res.status(200).json({success:true,totalAmount,orders})
})

// update order  --admin
exports.updateOrder=asyncHandler(async(req,res,next)=>{
    const id=req.params.id 
    const order=await Order.findById(id)
    if(!order){
        return next(new errorHandler("order not found",400))
    }
    if(order.orderStatus=="Delivered"){
        return next(new errorHandler("Product already been delivered",400))
    }
    order.orderItems.forEach((item)=>{
        updateQuantity(item.product,item.quantity)
    })
    order.orderStatus=req.body.status
    if(order.orderStatus=="Delivered"){
        order.deliveredAt=Date.now()
    }
    await order.save({validateBeforeSave:false})

    res.status(200).json({success:true,order})
})

// delete the order --admin

exports.deleteOrder=asyncHandler(async(req,res,next)=>{
    const id=req.params.id 
    const order=await Order.findById(id)
    if(!order){
        return next(new errorHandler("order not found",400))
    }
    await Order.findByIdAndDelete(id)
    res.status(200).json({success:true,message:"order is deleted successfully"})
})


// function to update the quantity of the product
const updateQuantity=async(id,quantity)=>{
     const product=await Product.findById(id)
     product.stock=product.stock-1 
     product.save({validateBeforeSave:false})
}


// if you update the quantity until negative it is not possible
// if product is not found then you are also able to proceed with controller but getting stock error check it
// 