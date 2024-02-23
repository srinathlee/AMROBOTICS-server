const mongoose=require("mongoose")

const blog=mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    description:{
        type:String,
        require:true 
    },
    likes:{
        type:Number
    },
    images: [
        {
          public_id: {
            type: String,
            required: true,
          },
    
          url: {
            type: String,
            required: true,
          },
        },
      ]
})

module.exports=blog