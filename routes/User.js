const express = require('express');
const userRouter = express.Router();
const passport = require('passport');
const passportConfig = require('../passport');
const JWT = require('jsonwebtoken');
const mongoose = require('mongoose')
const UserNew = require('../models/User');
const fs = require('fs');
const { spawn } = require('child_process');
const { S3, config } = require('aws-sdk')
config.update({ region: 'us-east-1' });
const btoa = require('btoa');
var adm = require('firebase-admin')
var firebase = require("firebase/app");
require("firebase/auth");
require("firebase/storage");

function makeid(length) {
    var result = '';
    var characters = 'ABJKLMNOPQRSIabcdefTUV!#$&WXgklmnopqrs89tuvw23456xyzhiYZCDEFGHj017';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    if (!validatePin(result)) {
        makeid(length)
    }
    else {
        return result;
    }
}

async function signIn(callback) {
    var token = await adm.auth().createCustomToken("amudejemedejamu", { hidden: process.env.hidden })
    firebase.auth().signInWithCustomToken(token).then(() => callback())
}

async function validatePin(qrPin) {
    await UserNew.findOne({ qrPin }, (err, doc) => {
        if (doc) {
            if (doc.length > 0) {
                return false
            }
        }
        return true
    });
}

userRouter.get('/tool', async (req, res) => {
    const users = await UserNew.find()
    if (users.length > 0) return res.json(users)
    else return res.send('Patineta')
})
userRouter.get('/regenerate', async (req, res) => {
    //APPLY S3 TO REGENERATE
    const users = await UserNew.find({})

    let userss = [];

    users.forEach(async user => {
        const pin = makeid(25)
        userss.push({ dni: user.dni, qrPin: pin, companyid: user.companyID })
        await UserNew.updateOne({ dni: user.dni }, { qrPin: pin })
    })
    const python = spawn('python', ['generate_qr_code.py', JSON.stringify(userss)])
    var largeDataSet = []
    await python.stdout.on('data', async (data) => {
        largeDataSet.push(data);
        var dataaaa = largeDataSet.join("")
        console.log(dataaaa)
    });
    return res.json(await UserNew.find())

})

userRouter.get('/tool2/:dni', async (req, res) => {
    await UserNew.findOne({ dni: req.params.dni }, function (err, doc) {
        doc.faceIds = []
        doc.save()
    })
    return res.json({ messi: 'messi' })
})

userRouter.get('/hola/:companyid/:dni', async (req, res) => {
    var companyID = req.params.companyid
    var dni = parseInt(req.params.dni)
    var path = `./qrcodes/${companyID}/${dni}.png`
    var a = Buffer.from(fs.readFileSync(path))
    signIn(() => {
        var ref = firebase.storage().ref(`${companyID}/qrcodes/${dni}.jpg`)
        ref.put(a).then(snap => {
            console.log("checkpoint")
            snap.ref.getDownloadURL().then(url => {
                console.log(url)
                mongoose.connection.useDb("lurien").collection("usernews").findOneAndUpdate(
                    { dni: parseInt(dni) },
                    { $set: { qrLink: url } }, (err,ress)=>{
                        if (err) return res.json("noo")
                        else return res.json("sii oo")
                    })
            })
        })
    })
})
userRouter.get('/mod', async (req, res) => {
    const users = await UserNew.find()
    return res.json(users)
})
userRouter.post('/registerNew', (req, res) => {
    const { dni, companyID, role, username } = req.body;
    mongoose.connection.useDb("lurien").collection("usernews").findOne({ dni }, (err, user) => {
        if (err)
            return res.json({ message: { msgBody: "Error has occured",err, msgError: true } });

        if (user)
            return res.json({ message: { msgBody: "Username is already taken", msgError: true } });
        else {
            const newUser = new UserNew({ username, dni, companyID, role });
            newUser.save(err => {
                if (err) {
                    return res.json({ message: { msgBody: "Error has occured", msgError: true } });
                }
                else
                    return res.status(201).json({ message: { msgBody: "Account successfully created", msgError: false } });
            });
        }
    });
});

userRouter.get('/users/:compid', async (req, res) => {
    const id = req.params.compid;
    const users = await UserNew.find({ companyID: id })
    return res.json(users)
})
userRouter.get('/delete/:_id', async (req, res) => {
    const id = req.params._id;
    const user = await UserNew.findOne({ "_id": id })
    await UserNew.deleteOne({ "_id": id })
    var dni = user.dni;
    var company = user.companyID;
    signIn(()=>{
        var ref = firebase.storage().ref(`${company}/`)
        ref.child(`pfp/${dni}.jpg`).delete()
        ref.child(`qrcodes/${dni}.jpg`).delete()
    })

})


userRouter.get('/getFotos/:dni', async (req, res) => {
    const dni = req.params.dni;
    const users = await UserNew.findOne({ "dni": dni })
    return res.json({ cantidad: users.cantidadFotos })
})
userRouter.get('/download/:companyid', async (req, res) => {
    const companyid = req.params.companyid
    var lionelmessi = [
        { path: './pickles/' + companyid + '/known_names', name: 'known_names' },
        { path: './pickles/' + companyid + '/known_faces', name: 'known_faces' }]
    return res.zip(lionelmessi);

})

userRouter.get('/get_data/:companyid', async (req, res) => {
    let companyid = req.params.companyid
    var largeDataSet = [];

    // const python = spawn('python', ['pickle_to_text_faces.py', companyid]);
    // console.log('afuera')

    // await python.stdout.on('data', async (data) => {
    //     console.log('adentro faces')
    //     largeDataSet.push(data);

    // });
    // await python.stdout.on('close', async code => {
    //     let rawData = largeDataSet.join("")
    //     let edited = rawData.slice(1, rawData.length - 3)
    //     let porArray = edited.split('array')
    //     let arrayDeEncodingss = []

    //     porArray.forEach(encoding => {
    //         if (encoding.length > 0) {
    //             arrayDeEncodingss.push(encoding.trim())
    //         }
    //     })
    //     let encoding_bien_format = []
    //     arrayDeEncodingss.forEach(arraydeencoding => {
    //         if (arraydeencoding[arraydeencoding.length - 1] == ',') {
    //             let uwu = arraydeencoding.slice(1, arraydeencoding.length - 2)

    //             encoding_bien_format.push(uwu.slice(2, uwu.length - 2))
    //         } else {
    //             encoding_bien_format.push(arraydeencoding.slice(2, arraydeencoding.length - 2))

    //         }
    //     })
    //     let encodings_correctos = []
    //     encoding_bien_format.forEach(encoding => {
    //         let elArray = []
    //         let numeros = encoding.split(',')
    //         numeros.forEach(numero => {
    //             elArray.push(parseFloat(numero.replace('\r\n', '').trim()))

    //         })
    //         encodings_correctos.push(elArray)
    //     })
    //     var laData = [];

    //     const python1 = spawn('python', ['pickle_to_text_names.py', companyid]);
    //     await python1.stdout.on('data', (data) => {
    //         console.log('adentro names')
    //         laData.push(data);

    //     });
    //     await python1.stdout.on('close', async code => {
    //         let rawData = laData.join("")
    //         let edited = rawData.slice(1, rawData.length - 3)
    //         let listed = edited.split(',')
    //         let final = []
    //         listed.forEach(dni => {
    //             final.push(parseInt(dni.trim().slice(1, dni.length - 2)))
    //         })

    //         return res.json({ names: final, faces: encodings_correctos })
    //     })
    // })

})
userRouter.get('/get_user_info/:companyid', async (req, res) => {
    let companyid = req.params.companyid;
    const usuarios = await User.find({ companyID: companyid, createdAccount: true })
    res.json({ users: usuarios })

})
userRouter.get('/zip/:companyid', async (req, res) => {
    const dni = req.params.companyid
    var lionelmessi = [
        { path: './pickles/' + dni + '/known_names', name: 'known_names' },
        { path: './pickles/' + dni + '/known_faces', name: 'known_faces' }]
    res.zip(lionelmessi);
})

userRouter.post('/addFotos/:dni', async (req, res) => {
    const dni = req.params.dni;
    const users = await UserNew.findOne({ "dni": dni })
    await UserNew.findOne({ dni: dni }, function (err, doc) {
        if (err) return false;

        doc.cantidadFotos += req.body.cantidad;
        doc.save()

    })
    res.json({ message: { msgBody: "todo ok", msgError: false } })

})
const signToken = userID => {
    return JWT.sign({
        iss: "leo-mattioli",
        sub: userID
    }, "leo-mattioli", { expiresIn: "1h" });
}
userRouter.put('/register', async (req, res) => {
    const { username, password, dni, companyID, mail } = req.body;
    const user_ = await UserNew.find({ companyID: companyID, dni: dni, createdAccount: false })
    if (user_.length !== 0 && user_ !== []) {
        await UserNew.findOne({ dni: dni }, async function (err, doc) {
            if (err) return false;
            const qrPin = makeid(25)
            const users = await UserNew.find({ username: username })
            if (users.length === 0) {
                doc.password = password;
                doc.username = username;
                doc.mail = mail;
                doc.createdAccount = true;
                doc.qrPin = qrPin;
                doc.save()
            } else {
                res.json({ message: { msgBody: "username taken", msgError: true } })
            }
            res.json({ message: { msgBody: "cuenta reg", msgError: false } })
            const python = spawn('python', ['qr_code.py', dni, companyID, qrPin])
            var largeDataSet = []
            await python.stdout.on('data', async (data) => {
                largeDataSet.push(data);
                var path = `./qrcodes/${companyID}/${dni}.png`
                var a = Buffer.from(fs.readFileSync(path))
                signIn(() => {
                    var ref = firebase.storage().ref(`${companyID}/qrcodes/${dni}.jpg`)
                    ref.put(a).then(snap => {
                        console.log("checkpoint")
                        snap.ref.getDownloadURL().then(url => {
                            console.log(url)
                            mongoose.connection.useDb("lurien").collection("usernews").findOneAndUpdate(
                                { dni: parseInt(dni) },
                                { $set: { qrLink: url } }
                            )
                        })
                    })
                })
            });
        })
    } else {
        res.json({ message: { msgBody: "hubo un error", msgError: true } });
    }
});
userRouter.post('/login', passport.authenticate('local', { session: false }), async (req, res) => {
    if (req.isAuthenticated()) {
        const { _id, username, role, dni, companyID, mail, cantidadFotos, pfp, qrLink, modelLinks } = req.user;
        console.log("[LOGIN]", req.user.pfp)
        var extras = {
            dni: `${dni}.jpg`,
            dniB: String(dni)
        }
        const token = signToken(_id);
        var fbtkn = await adm.auth().createCustomToken(String(dni), extras)
        res.cookie('access_token', token, { httpOnly: true, sameSite: true });
        res.status(200).json({ isAuthenticated: true, user: { username, role, dni, companyID, mail, cantidadFotos, pfp, qrLink, modelLinks }, fbToken: fbtkn });
    }
});
userRouter.get('/logout', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.clearCookie('access_token');
    res.json({ user: { username: "", role: "", dni: "", companyID: "", mail: "", cantidadFotos: 0, pfp: "" }, success: true });
});

userRouter.get('/authenticated', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const { username, role, dni, companyID, mail, cantidadFotos, pfp, qrLink, modelLinks } = req.user;
    res.status(200).json({ isAuthenticated: true, user: { username, role, dni, modeloEntrenado: false, companyID, mail, cantidadFotos, pfp, qrLink, modelLinks } });
});


module.exports = userRouter;