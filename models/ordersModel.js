const mongoose=require("mongoose")
const { default: isEmail } = require("validator/lib/isEmail")

const order=mongoose.Schema({
    order_id:{
        type:String,
        required:true
    },
    channel_order_id:{
        type:String,
        required:true
    },
    orderStatus:{
        type:String,
        required:true,
        default:"processing.."
    },
    shippingInfo:{
        name:{
            type:String,
            required:true
        },
        address:{
            type:String,
            required:true
        },
        country:{
            type:String,
            requiredd:true
        },
        state:{
            type:String,
            requiredd:true
        },
        city:{
            type:String,
            requiredd:true
        },
        pin:{
            type:Number,
            requiredd:true
        },
        mobile:{
            type:Number,
            required:true
        },
        email:{
            type:String,
            required:true
        }
    },
    orderItems:[
        {
            name:{
                type:String,
                required:true
            },
            units:{
                type:Number,
                required:true,
                default:1
            },
            images:{
                type:String,
                required:true
            },
            selling_price:{
                type:String,
                required:true
            },
            id:{
               type:mongoose.Schema.ObjectId,
               ref:"Product",
               required:true 
            },
            sku:{
                type:String,
                required:true
            }
        }
    ],
    user:{
        type:mongoose.Schema.ObjectId,
        ref:"User",
        required:true
    },
    payment_id:{
            type:String
    },
    // paidAt:{
    //     type:Date,
    //     // required:true
    // },
    itemsPrice:{
        type:Number,
        default:0
    },
    taxPrice:{
        type:Number,
        default:0
    },
    shippingPrice:{
        type:Number,
        default:0
    },
    totalPrice:{
        type:Number,
        default:0
    },
    paymode:{
      type:String,
      required:true
    },
  
    deliveredAt:Date,
    createdAt:{
        type:Date,
        default:Date.now()
    }
    
})

module.exports=new mongoose.model("Order",order)