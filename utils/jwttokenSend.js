// creating token and saving cookie

const sendJwt=async(user,statusCode,message,res)=>{
    const jwtToken =  user.jwtToken();
    // opitons for cookie
    const options={
        httpOnly:true,
        expires:new Date(Date.now()+process.env.COOKIE_EXPIRES*24*60*60*1000)
    }

    res.status(statusCode).cookie("jwtToken",jwtToken,options).json({success:true,message,jwtToken,user})
}

module.exports=sendJwt