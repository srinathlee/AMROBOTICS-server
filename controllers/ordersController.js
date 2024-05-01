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
   let PriceCal=0
   const {itemIds,cartAmount}=req.body

   await Promise.all(itemIds.map(async (cartItem) => {
       const product = await Product.findOne({ _id: cartItem.id });
       const productPrice = product.price;
       const productQuantity = cartItem.quantity;
       PriceCal = PriceCal + (productPrice * productQuantity);
   }))
   if(cartAmount!=PriceCal)
    return next(new errorHandler("error in price at frontend and backend",400))

   const pay_res=await payment.instance.orders.create({
        amount:PriceCal*100,
        currency: "INR"
        })
    res.status(200).json({success:true,message:"payment initiated",paymentId:pay_res})
  })

//   payment conformation__________________________________________
exports.paymentConform=asyncHandler(async(req,res,next)=>{
    const {paymentResponse,selectAddress,paymode,itemIds}=req.body
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

// order creation prepaid_________________________________________________
exports.createOrder=asyncHandler(async(req,res,next)=>{
  const {paymentResponse,selectAddress,paymode,itemIds}=req.body
  const {name,email,mobile,state,city,address,country,pin}=selectAddress;
  const {razorpay_payment_id,razorpay_order_id,razorpay_signature}=paymentResponse;
  const{user}=req 
  let PriceCal=0
  const cartData = await Promise.all(
    itemIds.map(async(cartItem)=>{
      const product = await Product.findOne({_id:cartItem.id},{name:1,images:1,price:1,sku:1})
      product.quantity=cartItem.quantity
      const productPrice = product.price;
      const productQuantity = cartItem.quantity;
      PriceCal = PriceCal + (productPrice * productQuantity);
      const item = {name:product.name,images:product.images[0],selling_price:product.price,units:cartItem.quantity,id:product.id,sku:product.sku}
      return item
      }))
     const randomId=randomnum()

    const dat= new Date(Date.now()).toISOString()
    const orderBody={
    order_id: randomId,
    order_date: "2024-02-24 11:11",
    pickup_location: "Primary",
    channel_id: "",
    comment: "",
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
    order_items: cartData,
    payment_method:paymode,
    shipping_charges: 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: 0,
    sub_total: PriceCal,
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
      'Authorization': "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjQzNzYzODQsInNvdXJjZSI6InNyLWF1dGgtaW50IiwiZXhwIjoxNzE0MzI1NDgxLCJqdGkiOiJ2RXVHV0VHZ1Q3MmxMRGZWIiwiaWF0IjoxNzEzNDYxNDgxLCJpc3MiOiJodHRwczovL3NyLWF1dGguc2hpcHJvY2tldC5pbi9hdXRob3JpemUvdXNlciIsIm5iZiI6MTcxMzQ2MTQ4MSwiY2lkIjo0MjUwODQ3LCJ0YyI6MzYwLCJ2ZXJib3NlIjpmYWxzZSwidmVuZG9yX2lkIjowLCJ2ZW5kb3JfY29kZSI6IiJ9.4IotMjw-wJg9UI77ckYT3wHBoSzPU2QrUSGzMAD7doo"
    },
    data :orderBody
  };

  axios(config).then(async function (response){
   const orderData={
    paymode,
    order_id:response.data.order_id,
    channel_order_id:response.data.channel_order_id,
    orderStatus:response.data.status,
    shippingInfo:selectAddress,
    orderItems:cartData,
    user:user._id,
    payment_id:razorpay_payment_id,
    itemsPrice:PriceCal,
    taxPrice:0,
    shippingPrice:0,
    totalPrice:PriceCal
   }

   const OrderData = await Order.create(orderData)
   res.json({message:"prepaid order place successfully",OrderData})
  })
  .catch(function (error) {
    console.log(error.response.data,"this is error")
    res.json(error.response.data.errors);
  }); 
})


// order creation cod _________________________________________________
exports.createCodOrder=asyncHandler(async(req,res,next)=>{
    const {selectAddress,paymode,itemIds}=req.body
    const {name,email,mobile,state,city,address,country,pin}=selectAddress;
    const{user}=req 
    let PriceCal=0
    const cartData = await Promise.all(
      itemIds.map(async(cartItem)=>{
        const product = await Product.findOne({_id:cartItem.id},{name:1,images:1,price:1,sku:1})
        product.quantity=cartItem.quantity
        const productPrice = product.price;
        const productQuantity = cartItem.quantity;
        PriceCal = PriceCal + (productPrice * productQuantity);
        const item = {name:product.name,images:product.images[0],selling_price:product.price,units:cartItem.quantity,id:product.id,sku:product.sku}
        return item
        }))
       const randomId=randomnum()
  
      const dat= new Date(Date.now()).toISOString()
      const orderBody={
      order_id: randomId,
      order_date: "2024-02-24 11:11",
      pickup_location: "Primary",
      channel_id: "",
      comment: "",
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
      order_items: cartData,
      payment_method:paymode,
      shipping_charges: 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: PriceCal,
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
        'Authorization': "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjQzNzYzODQsInNvdXJjZSI6InNyLWF1dGgtaW50IiwiZXhwIjoxNzE1NDExMDYzLCJqdGkiOiJsOWMyZVhBR1dVVkxIeUxYIiwiaWF0IjoxNzE0NTQ3MDYzLCJpc3MiOiJodHRwczovL3NyLWF1dGguc2hpcHJvY2tldC5pbi9hdXRob3JpemUvdXNlciIsIm5iZiI6MTcxNDU0NzA2MywiY2lkIjo0MjUwODQ3LCJ0YyI6MzYwLCJ2ZXJib3NlIjpmYWxzZSwidmVuZG9yX2lkIjowLCJ2ZW5kb3JfY29kZSI6IiJ9.wf-0hae0DBxzW5zCCioLb0Trac4x5LajsEpFDMEJ4pI"
      },
      data :orderBody
    };
  
    axios(config).then(async function (response){
     const orderData={
      paymode,
      order_id:response.data.order_id,
      channel_order_id:response.data.channel_order_id,
      orderStatus:response.data.status,
      shippingInfo:selectAddress,
      orderItems:cartData,
      user:user._id,
      itemsPrice:PriceCal,
      taxPrice:0,
      shippingPrice:0,
      totalPrice:PriceCal
     }
  
     const OrderData = await Order.create(orderData)
     res.json({message:"cod order place successfully",OrderData})
    })
    .catch(function (error) {
      console.log(error.response.data,"this is error")
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