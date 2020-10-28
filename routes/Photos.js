const express = require('express');
const userRouter = express.Router();
const UserNew = require('../models/User');
const mongoose = require('mongoose')
const AWSManager = require('../aws');
var adm = require('firebase-admin')
var request = require('request').defaults({ encoding: null });

userRouter.get('/hola', (req, res) => {
    res.json({ asdasd: "hollll" })
})
userRouter.post('/wipeFotos/:companyid/:dni', async (req, res) => {

    const dni = req.params.dni;
    const companyid = req.params.companyid
    const user = await UserNew.findOne({ dni: dni, companyID: companyid })
    var faceIdArray = user.faceIds
    var params = {
        CollectionId: companyid,
        FaceIds: faceIdArray
    }

    await UserNew.findOne({ dni: dni }, function (err, doc) {
        doc.modeloEntrenado = false
        doc.faceIds = []
        doc.modelLinks = []
        doc.cantidadFotos = 0
        doc.save()
    })
    try {
        AWSManager.deleteFaces(params)
    }
    catch {
        console.log('no tenes fotos picante d\'Or')
        return res.json('pito')
    }
    //FALTA BORRAR LAS FOTOS DE FIREBASE
    // emptyS3Directory('resources.lurien.team', `${companyid}/model/${dni}/`)

    return res.json('zapatilla')

})
userRouter.post('/upload/:companyid/:dni', async function (req, res) {
    var dni = parseInt(req.params.dni)
    var companyid = req.params.companyid
    var faceIdArray = req.body.data
    console.log(req.body.data)
    
    mongoose.connection.useDb("lurien").collection("usernews")
    var buffArrays = []
    for (let i = 0; i < faceIdArray.length; i++) {
        const element = faceIdArray[i];
        request.get(element, function (err, res, body) {
            buffArrays.push(body)
        });
    }
    AWSManager.listCollectionsAndAddFaces({}, { CollectionId: companyid }, buffArrays, req.params.dni, res)
    await UserNew.findOne({dni}, (err, doc)=>{
        doc.modelLinks = faceIdArray
        doc.save()
    })
});

userRouter.get('/testfb/:sth', async function (req, res) {
    
})

userRouter.post('/uploadPfp/:companyid/:dni', async function (req, res) {
    var dni = parseInt(req.params.dni)
    var companyid = req.params.companyid
    //console.log(">>", req.body.data)
    mongoose.connection.useDb("lurien").collection("usernews").findOneAndUpdate(
        {dni},
        {$set: {pfp:req.body.data} }
    )
})

module.exports = userRouter;
