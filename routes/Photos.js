const express = require('express');
const userRouter = express.Router();
const UserNew = require('../models/User');
const multer = require('multer');
const fs = require('fs');
const Path = require('path');
const { spawn } = require('child_process');
const AWSManager = require('../aws');
const {S3, config} = require('aws-sdk')
const multerS3 = require('multer-s3')
config.update({ region: 'us-east-1' });

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
    try{
        AWSManager.deleteFaces(params)
    }
    catch{
        console.log('no tenes fotos picante d\'Or')
        return res.json('pito')
    }
    
    await UserNew.findOne({ dni: dni }, function (err, doc) {
        doc.modeloEntrenado = false
        doc.faceIds = []
        doc.cantidadFotos = 0
        doc.save()
    })
    var alg = `${companyid}/model/${dni}/`
    emptyS3Directory('resources.lurien.team', `${companyid}/model/${dni}/`)
    return res.json('zapatilla')

})
userRouter.post('/upload/:companyid/:dni', async function (req, res) {
    var params = {

    }
    var bucket = `resources.lurien.team` //pal debugeo
    var s3 = new S3()
    // const direccion1 = 'fotitos/' + req.params.companyid;
    // const direccion2 = 'fotitos/' + req.params.companyid + '/' + req.params.dni;

    var storage = multerS3({
        s3: s3,
        acl:'public-read',
        bucket: bucket,
        metadata: function (req, file, cb) {
          cb(null, {fieldName: file.fieldname});
        },
        key: function (req, file, cb) {
            var extArr = file.originalname;
            let extensiones = ['.jpg', '.jpeg', '.png'];
            var extension = '';
            for (let i = 0; i < extensiones.length; i++) {

                if (extArr.includes(extensiones[i])) {
                    extension = extensiones[i]
                }
            }
            var name = req.body.username + '-' + Date.now()  + extension
            //console.log(req.body)aa
            cb(null, `${req.body.companyID}/model/${req.body.username}/${name}`)
        }
    })
    
    var upload = multer({ storage: storage }).array('file')
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(500).json(err)
        } else if (err) {
            return res.status(500).json(err)
        }
        var face_list = []
        s3.listObjects({Bucket:bucket}, function(err,data){
            if (err) throw err
            else{
                data.Contents.forEach(pic =>{
                    var key = pic.Key
                    s3.getObject({Bucket: bucket, Key: key}, function(err,dataUpl){
                        if (err) throw err
                        else {
                            face_list.push(dataUpl.Body)
                            if(face_list.length == data.Contents.length){
                                AWSManager.listCollectionsAndAddFaces({}, { CollectionId: req.body.companyID }, face_list, req.params.dni, res)
                            }
                        }
                    })
                })
            }
        })
    })
});
userRouter.post('/uploadPfp', async function (req, res) {

    var params = {

    }
    var bucket = `resources.lurien.team` 
    var s3 = new S3()
    // const direccion1 = 'fotitos/' + req.params.companyid;
    // const direccion2 = 'fotitos/' + req.params.companyid + '/' + req.params.dni;

    var storage = multerS3({
        s3: s3,
        acl:'public-read',
        bucket: bucket,
        metadata: function (req, file, cb) {
          cb(null, {fieldName: file.fieldname});
        },
        key: function (req, file, cb) {
            var extArr = file.originalname;
            let extensiones = ['.jpg', '.jpeg', '.png'];
            var extension = '';
            for (let i = 0; i < extensiones.length; i++) {

                if (extArr.includes(extensiones[i])) {
                    extension = extensiones[i]
                }
            }
            console.log('definido el name')
            //var name = req.body.username + '-' + Date.now()  + extension
            cb(null, `${req.body.companyID}/pfp/${req.body.username}${extension}`)
            //cb(null, `1a2b3c/pfp/45583265.png`)
        }
    })
    
    var upload = multer({ storage: storage }).array('file')
    upload(req, res, function (err) {
        console.log('entro al upload??')
        if (err instanceof multer.MulterError) {
            return res.status(500).json(err)
        } else if (err) {
            return res.status(500).json(err)
        } else{
            console.log('flinch')
            return res.status(200).json('picha al toke')
        }
    })
});


async function emptyS3Directory(bucket, dir) {
    var s3 = new S3()
    const listParams = {
        Bucket: bucket,
        Prefix: dir
    };

    const listedObjects = await s3.listObjectsV2(listParams).promise();

    if (listedObjects.Contents.length === 0) return;

    const deleteParams = {
        Bucket: bucket,
        Delete: { Objects: [] }
    };

    listedObjects.Contents.forEach(({ Key }) => {
        deleteParams.Delete.Objects.push({ Key });
    });

    await s3.deleteObjects(deleteParams).promise();

    if (listedObjects.IsTruncated) await emptyS3Directory(bucket, dir);
}

module.exports = userRouter;
