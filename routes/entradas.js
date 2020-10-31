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

userRouter.get("/historial/:companyId/arrayday", async (req,res) =>{
    //AGARRAR TODO SEPARAR EN ARRAYS BY FECHA Y AHI HACER LO DE LA FUNCION
    let companyID = req.params.companyId
    let entradas = await Entradas.find()
    const resuwultado = arraysplituwu(entradas)

    let imfuckingdone = []
    for (const arg in resuwultado){
        console.log(resuwultado[arg])
        lista = resuwultado[arg]
        let listavacia = []

        let uwu = 0
        while (lista.length > uwu){
            listavacia.push(lista[uwu].hora)
            uwu = uwu + 1
        }
        const resultadopapa = promedioHora(listavacia)
        imfuckingdone.push('dia: ' + arg + ', hora promedio: ' +  resultadopapa)
    }
    res.json(imfuckingdone)
})

userRouter.get("/historial/:companyId/:dni", async (req,res) =>{
    // FILTRAR POR FECHA, devuelve entradas de los ultimos 7 dias
    //esto es lo que se va  a ver en la pagina del user
    const { companyID, dni } = req.params

    const entUser = await Entradas.find({ dni: { $eq: dni } });
    const darvueltaArray = entUser.reverse()
    const resultado = removeDuplicatesFromArrayByProperty(darvueltaArray, 'fecha')
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

function arraysplituwu(entradas){

    shdjk = entradas.reduce(function(r, o){
        var k = o._doc.fecha;   // unique `loc` key
        if (r[k] || (r[k]=[])) r[k].push({hora: o._doc.hour, dni:o._doc.dni});
        return r;
    }, {});

    for (const arrName in shdjk){
        shdjk[arrName] = removeDuplicatesFromArrayByProperty(shdjk[arrName], 'dni')
    }
    return shdjk
} 


userRouter.get("/prueba", async (req,res) =>{
    let { resuwultado } = req.body
    // const abcdario = 0
    let imfuckingdone = []
    for (const arg in resuwultado){
        console.log(resuwultado[arg])
        lista = resuwultado[arg]
        let listavacia = []

        let uwu = 0
        while (lista.length > uwu){
            listavacia.push(lista[uwu].hora)
            uwu = uwu + 1
        }
        const resultadopapa = promedioHora(listavacia)
        imfuckingdone.push('dia: ' + arg + ', hora promedio: ' +  resultadopapa)
    }
    res.json(imfuckingdone)
})

function promedioHora(listowo){

    //promedio hora = 13:55, 16:56, 12:02, 17:45
    let horas = []
    let min = []
    let die = 0

    while(listowo.length > die){
        horas.push(listowo[die].slice(0,2))
        min.push(listowo[die].slice(3,5))
        die += 1
    }
    
    die = 0
    while (horas.length > die){
        horas[die] = horas[die] * 60
        min[die] = min[die] * 1
        die = die + 1
    }
    console.log(horas, min)
    // console.log(horas)
    // console.log(min)
    let allmin = horas.reduce((a, b) => a + b, 0) + min.reduce((a, b) => a + b, 0)
    allmin = allmin / listowo.length
    console.log(allmin)
    var hours = (allmin / 60);
    var rhours = Math.floor(hours);
    var minutes = (hours - rhours) * 60;
    var rminutes = Math.round(minutes);
    
    return rhours + ":" + rminutes;
}

module.exports = userRouter;