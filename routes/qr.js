const express = require('express');
const userRouter = express.Router();
const UserNew = require('../models/User');


userRouter.get('/hola', (req, res) => {
    res.json({ asdasd: "hollll" })
})

function makeid(length) {
    var result           = '';
    var characters       = 'ABJKLMNOPQRSIabcdefTUV!#$%&/WXgklmnopqrs89tuvw23456xyzhiYZCDEFGHj017';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    if(!validatePin(result)){
        makeid(length)
    }
    else{
        return result;
    }
 }
async function validatePin(qrPin){
    const users_with_pin = await UserNew.findOne({qrPin});
    if(users_with_pin.length > 0){
        return false
    }
    return true
}

userRouter.get("/generate", (req,res) =>{
    let qrCode = makeid(25) 
    res.json({qrCode})
})


module.exports = userRouter;
