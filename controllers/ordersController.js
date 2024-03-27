const Order=require("../models/ordersModel")
const Product=require("../models/productModels")
const errorHandler = require("../utils/errorHandler");
const asyncHandler = require("../middleware/asynchandler");
const isAuthorized = require("../middleware/auth");
const payment=require("../server")
const randomnum=require("../utils/randomgenerator")
const axios =require('axios')




// payment initiation
exports.initPayment=asyncHandler(async(req,res,next)=>{
   const totalPrice=req.body.totalPrice
   const pay_res=await payment.instance.orders.create({
        amount:totalPrice*100,
        currency: "INR"
        })
    res.status(200).json({success:true,message:"payment initiated",paymentId:pay_res})
  })

//   payment conformation
exports.paymentConform=asyncHandler(async(req,res,next)=>{
    console.log(req.body)
    const { razorpay_payment_id} = req.body.response;
    console.log(razorpay_payment_id)
    if(razorpay_payment_id){
    req.razorpay_payment_id=razorpay_payment_id
    next()
    }
})

// order creation
exports.createOrder=asyncHandler(async(req,res,next)=>{
     const randomId=randomnum()
     // const{shippingInfo,orderItems,itemsPrice,taxPrice,shippingPrice,totalPrice,paymentInfo}=req.body;
    // we will send only about for payment initiation

//     const shippingInfo={
//     address:"bijwaram",
//     country:"india",
//     state:"talangana",
//     city:"gadwal",
//     mobile:9988776655
//    }

//   const orderItems=[{
//    name:"product1",
//    quantity:1,
//    images:"sampleimage",
//    price:"122",
//    product:"65561daaa7406f78570f5e18"
//    }]

//    const itemsPrice=100
//    const taxPrice=10
//    const shippingPrice=20
//    const totalPrice=130
//    const orderStatus="processing.."
//    const userId="65959e5e59de3858540259ec"


//    const order=await Order.create({
//         shippingInfo,
//         orderItems,
//         itemsPrice,
//         taxPrice,
//         shippingPrice,
//         totalPrice,
//         user:userId
//     })


// ____________________________________________________________


console.log(randomId)
const orderBody=JSON.stringify({
    order_id: randomId,
    order_date: "2024-02-24 11:11",
    pickup_location: "Primary",
    channel_id: "",
    comment: "Reseller: M/s Goku",
    billing_customer_name: "ravi",
    billing_last_name: "T raghu",
    billing_address: "gadwal,kondapally",
    billing_address_2: "near temple",
    billing_city: "Gadwal",
    billing_pincode: "509132",
    billing_state: "telangana",
    billing_country: "India",
    billing_email: "ravi@uzumaki.com",
    billing_phone: "9876543210",
    shipping_is_billing: true,
    shipping_customer_name: "",
    shipping_last_name: "",
    shipping_address: "",
    shipping_address_2: "",
    shipping_city: "",
    shipping_pincode: "",
    shipping_country: "",
    shipping_state: "",
    shipping_email: "",
    shipping_phone: "",
    order_items: [
      {
        name: "shirt",
        sku: "chakra123",
        units: 10,
        selling_price: "900",
        discount: "",
        tax: "",
        hsn: 441122
      }
    ],
    payment_method: "Prepaid",
    shipping_charges: 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: 0,
    sub_total: 9000,
    length: 10,
    breadth: 15,
    height: 20,
    weight: 2.5
  })



   const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
    headers: { 
      'Content-Type': "application/json", 
      'Authorization': "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2FwaXYyLnNoaXByb2NrZXQuaW4vdjEvZXh0ZXJuYWwvYXV0aC9sb2dpbiIsImlhdCI6MTcwODA2NTMyOSwiZXhwIjoxNzA4OTI5MzI5LCJuYmYiOjE3MDgwNjUzMjksImp0aSI6InBYd0J2UGE4dWxReTBhZlkiLCJzdWIiOjQ0NDA0NjQsInBydiI6IjA1YmI2NjBmNjdjYWM3NDVmN2IzZGExZWVmMTk3MTk1YTIxMWU2ZDkiLCJjaWQiOjQyNTA4NDd9.pRWI69r5Sa7nYEtyxAlURyf-tqfqXXf2UbFipHv3m4Q"
    },
    data :orderBody
  };

  axios(config)
  .then(function (response) {
    // console.log(response.data)
  res.json({response:response.data})
  })
  .catch(function (error) {
    console.log(error);
  });


 
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