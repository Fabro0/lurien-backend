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
    emptyS3Directory('lurien1a2b3c', `${companyid}/model/${dni}/`)
    return res.json('zapatilla')

})
userRouter.post('/upload/:companyid/:dni', async function (req, res) {
    var params = {

    }
    var bucket = `lurien1a2b3c` //pal debugeo
    var s3 = new S3()
    // const direccion1 = 'fotitos/' + req.params.companyid;
    // const direccion2 = 'fotitos/' + req.params.companyid + '/' + req.params.dni;

    var storage = multerS3({
        s3: s3,
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
            console.log(req.body)
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


        // fs.readdir(direccion2, (err, files) => {
        //     var face_list = []
        //     files.forEach(file => {
        //         var cntn = fs.readFileSync(direccion2 + '/' + file)
        //         face_list.push(cntn)
        //         fs.unlinkSync(direccion2 + '/' + file)
        //     })
        //     AWSManager.listCollectionsAndAddFaces({}, { CollectionId: req.body.companyID }, face_list, req.params.dni, res)

        // })
    })
});
userRouter.post('/uploadPfp', async function (req, res) {

    var storage = multer.diskStorage({
        destination: function (req, file, cb) {
            const direccion1 = 'users/' + req.body.companyID;
            const direccion2 = 'users/' + req.body.companyID + '/' + req.body.username;
            var cr = false;
            var cro = false;
            if (!fs.existsSync(direccion1)) {
                fs.mkdir(direccion1, err => {
                    if (err) {
                        console.log(err)
                    }
                })
                cr = true;
            }
            else {
                cr = true;
            }
            if (cr) {
                if (!fs.existsSync(direccion2)) {
                    fs.mkdir(direccion2, err => {
                        if (err) {
                            console.log(err)
                        }
                    })
                    cro = true;
                }
                else {
                    cro = true;
                }
                if (cro) {
                    cb(null, direccion2)
                }
            }
        },
        filename: function (req, file, cb) {
            var extArr = file.originalname;
            let extensiones = ['.jpg', '.jpeg', '.png'];
            var extension = '';
            for (let i = 0; i < extensiones.length; i++) {
                if (extArr.includes(extensiones[i])) {
                    extension = extensiones[i]
                }
            }
            cb(null, req.body.username + extension)
        }
    })
    var upload = multer({ storage: storage }).array('file')
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(500).json(err)
        } else if (err) {
            return res.status(500).json(err)
        }

        return res.status(200).send(req.file)

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
