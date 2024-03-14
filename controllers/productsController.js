const Product = require("../models/productModels");
const errorHandler = require("../utils/errorHandler");
const asyncHandler = require("../middleware/asynchandler");
const apiFeatures = require("../utils/apiFeatures");
const isAuthorized = require("../middleware/auth");

// Getall products_________________________________________________________________________
exports.getAllProducts = asyncHandler(async (req, res, next) => {
  const filter=req.body 
  const resultPerPage = 7;
  const apiFeature = new apiFeatures(Product.find({},{name:1,category:1,images:1,price:1,rating:1}), filter.filter)
    .search()
    .filter()
    .pagination(resultPerPage);
    const products = await apiFeature.query;
    console.log(products)
    const productCount = products.length
  res.status(200).json({ success: true, productCount, products });
});

// get single product______________________________________________________________________
exports.getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new errorHandler("product not found", 505));
  }

  res.status(200).json({ success: true, product });
  });

// Create product ---Admin_________________________________________________________________
exports.createProduct = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user.id;
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, product });
});

// Update product ---Admin_________________________________________________________________
exports.updataProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);
  if (!product) {
    return next(new errorHandler("product not found", 505));
  }
  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  return res.status(201).json({ success: true, product });
});

// Delete product ---Admin_________________________________________________________________
exports.deleteProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);
  if (!product) {
    return next(new errorHandler("product not found", 501));
  }
  await product.deleteOne();
  res
    .status(200)
    .json({ success: true, message: "product deleted successfully" });
});

// create review and update review ________________________________________________________
exports.createReview=asyncHandler(async(req,res,next)=>{
  const {name,comment,rating,productId}=req.body
  const review={
    "user":req.user.id,
    name,
    comment,
    rating:Number(rating)
  }
  const product=await Product.findById(productId)
  // checking weather user already wrote review or not
  const isReviewed=product.reviews.find((rev)=>{
    return (rev.user.toString() ==req.user.id)
    })
  if(isReviewed){
    product.reviews.forEach((rev)=>{
      if(rev.user.toString()===req.user.id){
        rev.rating=rating;
        rev.comment=comment;
      }
    })
  }
  else{
    product.reviews.push(review)
  }
  // no of reviews calculation
  product.noOfReviews=product.reviews.length
  // rating calculation
  let avg=0
  reviewsCount=product.reviews.length
  product.reviews.forEach((rev)=>avg+=rev.rating)
  product.rating=avg/reviewsCount

  await product.save({validateBeforeSave:false})
  res.status(200).json({success:true,message:"reviewed product successfully"})
})

// getall reviews of a product_____________________________________________________________
exports.getAllReviews=asyncHandler(async(req,res,next)=>{
  const productId=req.query.productId
  const product=await Product.findById(productId)
  if(!product){
    next(new errorHandler("Product not found",400))
  }
  res.status(200).json({success:true,reviews:product.reviews})
})

// delete review___________________________________________________________________________
exports.deleteReview=asyncHandler(async(req,res,next)=>{
  const productId=req.query.productId
  const product=await Product.findById(productId)
  if(!product){
    next(new errorHandler("Product not found",400))
  }
  const reviews=product.reviews.filter((rev)=>(rev.user.toString()!=req.user.id))
  product.reviews=reviews 
  await product.save({validateBeforeSave:false})
  res.status(200).json({success:true,message:"review deleted successfully"})
})
