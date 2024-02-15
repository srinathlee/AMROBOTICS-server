const errorHandler=require("../utils/errorHandler")

module.exports=(err,req,res,next)=>{
    err.message=err.message||"internal server error"
    err.status=err.status||500

    // Wrong mongodb id error
    if(err.name=="CastError"){
        const message=`Resource not found Invalid:${err.path}`
        err=new errorHandler(message,400)
    }

    // mongodb duplicate key error
    if(err.code==11000){
        const message=`Duplicate ${Object.keys(err.keyValue)} Entered`
        err=new errorHandler(message,400)
    }

    // wrong jwt token error

    // jwt token expired
    res.status(err.status).json({success:false,error:err.message})
}