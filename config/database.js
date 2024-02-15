const mongoose=require("mongoose")

const connectDatabase=()=>{
    mongoose.connect(process.env.DB_URI)
    .then((data)=>console.log(`database is connected at server:${data.connection.host}`))
    .catch((err)=>console.log("error while connecting to database"))
}

module.exports=connectDatabase