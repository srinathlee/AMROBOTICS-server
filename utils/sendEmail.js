const nodemailer=require("nodemailer")

const sendEmail=async(options)=>{
    const transporter=nodemailer.createTransport({
        service:process.env.MAIL_SERVICE,
        auth:{
            user:process.env.MAIL_SENDER,
            pass:process.env.MAIL_SENDER_PASSWORD
             }
    })

    const mailOptions={
        from:process.env.MAIL_SENDER,
        to:options.email,
        subject:"reset password",
        text:options.message
        }
    await transporter.sendMail(mailOptions)

}

module.exports=sendEmail