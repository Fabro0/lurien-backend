const express = require('express');
const userRouter = express.Router();
const UserNew = require('../models/User');
const Pusher = require("pusher")

var pusher = new Pusher({
    appId: '1082208',
    key: 'b103ad2b1e20a1198455',
    secret: '5ddd5781b85de3eed2d7',
    cluster: 'us2',
    encrypted: true
});

userRouter.post("/companyid", async (req, res) => {
    // const { companyid } = req.params
    // let nombres = ["brenda", "tievo", "benatize", "gati", "fabro"]
    // let name = nombres[Math.floor(Math.random() * nombres.length)];
    // let hour = Date.now()
    const {name,hour,companyid, img} = req.body;

    pusher.trigger(companyid, 'updateEntrada', {
        'name': name,
        'hora': hour,
        'img': img
    });
    res.json({ companyid, name, hour })

})
module.exports = userRouter;
