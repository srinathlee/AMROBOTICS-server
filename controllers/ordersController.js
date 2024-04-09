const Order=require("../models/ordersModel")
const Product=require("../models/productModels")
const errorHandler = require("../utils/errorHandler");
const asyncHandler = require("../middleware/asynchandler");
const isAuthorized = require("../middleware/auth");
const payment=require("../server")
const randomnum=require("../utils/randomgenerator")
const axios =require('axios')
const crypto = require('crypto');





// payment initiation____________________________________________
exports.initPayment=asyncHandler(async(req,res,next)=>{
   const totalPrice=req.body.totalPrice
   const pay_res=await payment.instance.orders.create({
        amount:totalPrice*100,
        currency: "INR"
        })
    res.status(200).json({success:true,message:"payment initiated",paymentId:pay_res})
  })

//   payment conformation__________________________________________
exports.paymentConform=asyncHandler(async(req,res,next)=>{
    const {paymentResponse,selectAddress,paymode}=req.body
     const { razorpay_payment_id,razorpay_signature,razorpay_order_id} = paymentResponse;
     
     const text = `${razorpay_order_id}|${razorpay_payment_id}`;
     const generatedsignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY).update(text).digest('hex');

    if(generatedsignature==razorpay_signature){
    req.paymentResponse=paymentResponse;
    req.selectAddress=selectAddress;
    req.paymode=paymode;
    next()
    }
})

// order creation
exports.createOrder=asyncHandler(async(req,res,next)=>{
     const randomId=randomnum()
     const {paymentResponse,selectAddress,paymode}=req.body
     const {name,email,mobile,state,city,address,country,pin}=selectAddress;
     const {razorpay_payment_id,razorpay_order_id,razorpay_signature}=paymentResponse;

const orderBody={
    order_id: randomId,
    order_date: "2024-02-24 11:11",
    pickup_location: "Primary",
    channel_id: "",
    comment: "Reseller: M/s Goku",
    billing_customer_name: name,
    billing_last_name: "",
    billing_address:address,
    billing_address_2: "",
    billing_city:city,
    billing_pincode:pin,
    billing_state:state,
    billing_country:country,
    billing_email:email,
    billing_phone:mobile,
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
    payment_method:paymode,
    shipping_charges: 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: 0,
    sub_total: 9000,
    length: 10,
    breadth: 15,
    height: 20,
    weight: 2.5
  }


   const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
    headers: { 
      'Content-Type': "application/json", 
      'Authorization': "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjQzNzYzODQsInNvdXJjZSI6InNyLWF1dGgtaW50IiwiZXhwIjoxNzEyNTU4ODI4LCJqdGkiOiJaTUVwb3RLMFFFazJMRkJ6IiwiaWF0IjoxNzExNjk0ODI4LCJpc3MiOiJodHRwczovL3NyLWF1dGguc2hpcHJvY2tldC5pbi9hdXRob3JpemUvdXNlciIsIm5iZiI6MTcxMTY5NDgyOCwiY2lkIjo0MjUwODQ3LCJ0YyI6MzYwLCJ2ZXJib3NlIjpmYWxzZSwidmVuZG9yX2lkIjowLCJ2ZW5kb3JfY29kZSI6IiJ9.Hg8AeNZYsNh5GLTKNTplcYX1yR0tcCrHtIBJdr-f9XU"
    },
    data :orderBody
  };


  axios(config)
  .then(function (response) {
  res.json({response:response.data})
  })
  .catch(function (error) {
    console.log(error.response.data.errors)
    res.json(error.response.data.errors);
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