const express = require('express');
const userRouter = express.Router();
const UserNew = require('../models/User');
const multer = require('multer');
const fs = require('fs');
const Path = require('path');
const { spawn } = require('child_process');
const AWSManager = require('../aws');

userRouter.get('/hola', (req, res) => {
    res.json({ asdasd: "hollll" })
})
userRouter.post('/wipeFotos/:dni', async (req, res) => {
    const dni = req.params.dni;
    const companyid = req.body.companyid
    const user = await UserNew.findOne({ "dni": dni })
    var faceIdArray = user.faceIds
    var params = {
        CollectionId: companyid,
        FaceIds: faceIdArray
    }
    AWSManager.deleteFaces(params)
    await UserNew.findOne({ dni: dni }, function (err, doc) {
        doc.modeloEntrenado = false
        doc.faceIds = []
        doc.save()
    })

})
userRouter.post('/upload/:companyid/:dni', async function (req, res) {
    var params = {

    }
    const direccion1 = 'fotitos/' + req.params.companyid;
    const direccion2 = 'fotitos/' + req.params.companyid + '/' + req.params.dni;
    var storage = multer.diskStorage({

        destination: function (req, file, cb) {


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
            cb(null, req.body.username + '-' + Date.now() + '.' + extension)
        }
    })
    var upload = multer({ storage: storage }).array('file')
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(500).json(err)
        } else if (err) {
            return res.status(500).json(err)
        }
        fs.readdir(direccion2, (err, files) => {
            var face_list = []
            files.forEach(file => {
                var cntn = fs.readFileSync(direccion2 + '/' + file)
                face_list.push(cntn)
                fs.unlinkSync(direccion2 + '/' + file)
            })
            AWSManager.listCollectionsAndAddFaces({}, { CollectionId: req.body.companyID }, face_list, req.params.dni, res)

        })
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

module.exports = userRouter;
