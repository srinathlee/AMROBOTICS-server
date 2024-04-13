const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "please enter product name"],
  },
  description: {
    type: String,
    required: [true, "please enter product description"],
  },
  price: {
    type: Number,
    required: [true, "please enter product Price"],
  },
  rating: {
    type: Number
  },
  insideBox:{
    type: String,
    required: [true, "please enter product description"],
  },
  images: {
    type: [String], 
    required: true, 
    default: [] 
  },
  category: {
    type: String,
    required: [true, "please enter product category"],
  },
  stock: {
    type: Number,
    required: [true, "please enter product Stock"],
    maxlength: [4, "max length of stock should not exceed 4 characters"],
    default: 1,
  },
  reviews: [
    {
      user:{
        type:mongoose.Schema.ObjectId,
        ref:"User",
       },
      name: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],
  noOfReviews: {
    type: Number,
    default: 0,
  },
  createdBy:{
   type:mongoose.Schema.ObjectId,
   ref:"User",
  },
  createdat: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Product", ProductSchema);
