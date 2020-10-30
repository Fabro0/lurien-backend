const express = require('express');
const userRouter = express.Router();
const mongoose = require('mongoose')
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
    const {name,hour,fecha,companyid, img} = req.body;
    console.log("[IMG]",img)
    pusher.trigger(companyid, 'updateEntrada', {
        'name': name,
        'hour': hour,
        'img': img,
        'fecha': fecha
    });
    res.json({ companyid, name, hour, fecha })

})
userRouter.get("/historial/:companyId", async (req,res) =>{
    // let hola = "culo";
    let companyID = req.params.companyId
    let limit = 10;
    let skip = 0;
    mongoose.connection.useDb("lurien").collection("entradas")
    let entradas = await Entradas.find().limit(limit).skip(skip).sort({_id:-1});
     
    console.log(entradas)
    res.json({entradas})
})

userRouter.get("/historial/:companyId/norep", async (req,res) =>{
    //AGARRAR TODO SEPARAR EN ARRAYS BY FECHA Y AHI HACER LO DE LA FUNCION
    let companyID = req.params.companyId
    let entradas = await Entradas.find()
    const resuwultado = removeDuplicatesFromArrayByProperty(entradas, 'dni')
    res.json({resuwultado})
})

userRouter.get("/historial/:companyId/:dni", async (req,res) =>{
    // FILTRAR POR FECHA, devuelve entradas de los ultimos 7 dias
    //esto es lo que se va  a ver en la pagina del user
    const { companyID, dni } = req.params

    const entUser = await Entradas.find({ dni: { $eq: dni } });
    const resultado = removeDuplicatesFromArrayByProperty(entUser, 'fecha')
    if (resultado.length > 7)
        resultado = resultado.slice(1, 7)
    console.log(resultado);
    res.json({resultado})
})

const removeDuplicatesFromArrayByProperty = (arr, prop) => arr.reduce((accumulator, currentValue) => {
    if(!accumulator.find(obj => obj[prop] === currentValue[prop])){
      accumulator.push(currentValue);
    }
    return accumulator;
}, [])



module.exports = userRouter;