const app = require("./app");
const { config } = require("dotenv");
const connectDatabase = require("./config/database");
const Razorpay=require("razorpay")
const cloudinary=require('cloudinary')


// handling uncaught error
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log("shutting down the server due to uncaught error...........");
  process.exit(1);
});


// env config
config({ path: "config/config.env" });

          
cloudinary.config({ 
  cloud_name: process.env.cloud_name, 
  api_key:process.env.cloud_api_key, 
  api_secret:process.env.cloud_api_secret 
});


// initiating razorpay instance
exports.instance = new Razorpay({ key_id:process.env.RAZORPAY_ID,key_secret:process.env.RAZORPAY_KEY})


// database connection
connectDatabase();

// app listening at port
const server = app.listen(process.env.PORT, () =>
  console.log(`app is running at port ${process.env.PORT}`)
);

// unhandled promise rejection
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  console.log("shutting down the server due to Unhandled promise rejection...........");
  server.close(() => {
    process.exit(1);
  });
});


