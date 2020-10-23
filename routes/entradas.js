const express = require('express');
const userRouter = express.Router();
const UserNew = require('../models/User');
const Pusher = require("pusher")
const Entradas = require("../models/Entrada");


var pusher = new Pusher({
    appId: '1082208',
    key: 'b103ad2b1e20a1198455',
    secret: '5ddd5781b85de3eed2d7',
    cluster: 'us2',
    encrypted: true
});

userRouter.post("/new", async (req, res) => {
    // const { companyid } = req.params
    // let nombres = ["brenda", "tievo", "benatize", "gati", "fabro"]
    // let name = nombres[Math.floor(Math.random() * nombres.length)];
    // let hour = Date.now()
    const {name,hour,companyid, img} = req.body;
    console.log("[IMG]",img)
    pusher.trigger(companyid, 'updateEntrada', {
        'name': name,
        'hour': hour,
        'img': img
    });
    res.json({ companyid, name, hour })

})
userRouter.get("/historial", async (req,res) =>{
    let hola = "culo";
    
    let limit = 10;
    let skip = 0;

    let entradas = await Entradas.find({}).limit(limit).skip(skip).sort({_id:-1});

    res.json({entradas})
})
module.exports = userRouter;
