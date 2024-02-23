const uuid = require('uuid');

function generateOrderID() {
    const timestamp = new Date().getTime(); // Get current timestamp
    const randomPart = uuid.v4().split('-').join('').substring(0, 6); // Generate a random string
    const orderID = `order-${timestamp}-${randomPart}`;
    return orderID;
}

module.exports=generateOrderID