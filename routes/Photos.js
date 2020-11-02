const express = require('express');
const userRouter = express.Router();
const UserNew = require('../models/User');
const multer = require('multer');
const mongoose = require('mongoose')
const AWSManager = require('../aws');
const { S3, config } = require('aws-sdk')
const multerS3 = require('multer-s3')
config.update({ region: 'us-east-1' });
var adm = require('firebase-admin')
var request = require('request').defaults({ encoding: null });
var firebase = require("firebase/app");
require("firebase/auth");
require("firebase/storage");



userRouter.get('/hola/:companyid/:dni', async (req, res) => {
    const dni = req.params.dni;
    const companyid = req.params.companyid
    const user = await UserNew.findOne({ dni: dni, companyID: companyid })
    return res.json(user)
})

userRouter.get('/testrek', async (req, res)=>{
    AWSManager.createCollection({CollectionId:'TEST'}, ()=>{
        res.json("saas")
    })
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
