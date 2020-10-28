const express = require('express');
const userRouter = express.Router();
const passport = require('passport');
const JWT = require('jsonwebtoken');
const mongoose = require('mongoose')
const UserNew = require('../models/User');
const CompanyAreaNew = require('../models/CompanyAreas')
const TempTokenNew = require('../models/TempToken')
const uuid = require('uuid')
const qr = require('qrcode')
var adm = require('firebase-admin')
var nodemailer = require('nodemailer');

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
    const users = await UserNew.find({})

    let userss = [];
    //falta basicamente generar las imagenes owo
    users.forEach(async user => {
        const pin = makeid(25)
        userss.push({ dni: user.dni, qrPin: pin, companyid: user.companyID })
        await UserNew.updateOne({ dni: user.dni }, { qrPin: pin })
    })
    return res.json(await UserNew.find())

})

userRouter.get('/tool2/:dni', async (req, res) => {
    await UserNew.findOne({ dni: req.params.dni }, function (err, doc) {
        doc.faceIds = []
        doc.save()
    })
    return res.json({ messi: 'messi' })
})
userRouter.get('/tool3/:dni', async (req, res) => {
    await UserNew.findOne({ dni: req.params.dni }, function (err, doc) {
        doc.area = "tu vieja"
        doc.save()
    })
    return res.json({ messi: 'messi' })
})


//get all users area == area mandada && role == 'user' uwu
userRouter.get('/manUser', async (req, res) => {
    const { area } = req.body;
    const users = await UserNew.find({ area: { $eq: area } });
    console.log(users)
    if (users.length > 0) return res.json({ message: { msgBody: users, msgError: false } })
    else return res.json({ message: { msgBody: [], msgError: true } })
})

userRouter.get('/mod', async (req, res) => {
    const users = await UserNew.find()
    return res.json(users)
})

userRouter.get('/deleteArea', async (req, res) => {
    const { companyId, area } = req.body;
    mongoose.connection.useDb("lurien").collection("companyareas")
    await CompanyAreaNew.findOne({ companyId }, (err, company) => {
        console.log(company.areas)
        if (err)
            return res.json({ message: { msgBody: "Hubo un error con el pedido al servidor, ya nos estamos encargando!", err, msgError: true } });

        else {
            var array = company.areas
            if (array.includes(area)) {
                array = array.filter(e => e !== area);
                // console.log('array le saco: ' + array)
                company.areas = array;
                // console.log('company.areas: ' + company.areas)
                company.save()
                return res.json({ message: { msgBody: company.areas, msgError: false } });
            }
        }
    })

})

userRouter.get('/retrieveArea/:companyId', async (req, res) => {
    const { companyId } = req.params;
    console.log(companyId)
    await mongoose.connection.useDb("lurien").collection("companyareas").findOne({ companyId }, (err, company) => {
        if (err)
            return res.json({ message: { msgBody: "Hubo un error con el pedido al servidor, ya nos estamos encargando!", err, msgError: true } });
        else {
            if (!company) {
                return res.json({ message: { msgBody: "Error area compania uwu", msgError: true } });
            }
            else {
                console.log(company)
                return res.json({ message: { msgBody: company.areas, msgError: false } });
            }
        }
    })
})



userRouter.post('/addArea', async (req, res) => {
    const { companyId, areas } = req.body;
    console.log(companyId)
    mongoose.connection.useDb("lurien").collection("companyareas")
    await CompanyAreaNew.findOne({ companyId }, (err, company) => {
        if (err)
            return res.json({ message: { msgBody: "Hubo un error con el pedido al servidor, ya nos estamos encargando!", err, msgError: true } });
        else {
            if (!company) {
                console.log(company)
                const newCompany = new CompanyAreaNew({ areas: areas, companyId: companyId });
                console.log(newCompany)
                newCompany.save(err => {
                    if (err) {
                        return res.json({ message: { msgBody: "Hubo un error con el pedido al servidor, ya estamos solucionando!", msgError: true } });
                    }
                    else
                        return res.status(201).json({ message: { msgBody: "Company slot creado!", msgError: false } });
                })

            }
            else {
                var array = company.areas
                if (!array.includes(areas)) {
                    array.push(areas)
                    company.areas = array;
                    company.save()
                    return res.json({ message: { msgBody: company.areas, msgError: false } });
                }
                else
                    return res.json({ message: { msgBody: "ese area ya existe", msgError: true } });

            }
        }
    })
})

userRouter.post('/registerNew', (req, res) => {
    let { dni, companyID, role, mail, manArea, area } = req.body;
    console.log("HOLA", dni, companyID, role, mail, manArea, area)

    manArea !== null ? area = manArea : area = area

    var errorMan = false;
    mongoose.connection.useDb("lurien").collection("usernews").findOne({ dni }, (err, user) => {

        if (err)
            return res.json({ message: { msgBody: "Hubo un error con el pedido al servidor, ya nos estamos encargando!", err, msgError: true } });

        if (user)
            return res.json({ message: { msgBody: "Ese nombre o DNI ya esta existe en esta compañia!", msgError: true } });

        if (role != "manager" && manArea != null) {
            errorMan = true;
            return res.json({ message: { msgBody: "Estas intentando asignarle un area a un noadmin", msgError: true } });
        }

        if (role == "manager" && manArea == null) {
            errorMan = true;
            return res.json({ message: { msgBody: "No le asignaste un area de manejo al manager", msgError: true } });
        }


        else {
            console.log(errorMan)
            if (!errorMan) {
                const newUser = new UserNew({ mail, dni, companyID, role, manArea, area });
                console.log("AREA", area)
                newUser.save(err => {
                    if (err) {
                        return res.json({ message: { msgBody: "Hubo un error con el pedido al servidor, ya estamos solucionando!", msgError: true } });
                    }
                    else
                        return res.status(201).json({ message: { msgBody: "Usuario Creado!", msgError: false } });
                });
            }
        }
    });
    const text = `<p>hace click <a href="http://localhost:8080/api/user/Register" target="_blank">aqui</a></p>`
    mandarMail(mail, text)
});

function mandarMail(userTo, text) {
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'lurien.donotreply@gmail.com',
            pass: 'mattioliLearning'
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    var mailOptions = {
        from: 'lurien.donotreply@gmail.com',
        to: userTo,
        subject: 'LURIEN- Register',
        html: text,
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

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

    //USE FIREBASE ADMIN TO DELETE ALL PICS FROM THE USER
    var bucket = adm.storage().bucket("test-lurien.appspot.com")
    bucket.file(`${company}/qrcodes/${dni}.png`).delete()
    bucket.file(`${company}/pfp/${dni}.png`).delete()
    bucket.deleteFiles({prefix: `${company}/model/${dni}/`})
})


userRouter.get('/getFotos/:dni', async (req, res) => {
    const dni = req.params.dni;
    const users = await UserNew.findOne({ "dni": dni })
    return res.json({ cantidad: users.cantidadFotos })
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
    res.json({ message: { msgBody: "Todo salio bien!", msgError: false } })

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
            if (err) return res.json({ message: { msgBody: "Hubo un error con el pedido al servidor, ya nos encargamos!", msgError: true } });
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
                res.json({ message: { msgBody: "El usuario ingresado ya está en uso, prueba otro!", msgError: true } })
            }
            res.json({ message: { msgBody: "cuenta reg", msgError: false } })

            qr.toBuffer(qrPin, (err, buff) => {
                if (err) throw err
                var gPath = `${companyID}/testQr2/${dni}.png`
                var bucket = "test-lurien.appspot.com"
                var tkn = uuid.v4()
                var link = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(
                    gPath
                )}?alt=media&token=${tkn}`
                var stream = adm.storage().bucket(bucket).file(gPath).createWriteStream({
                    metadata: {
                        metadata: {
                            contentType: "image/png",
                            firebaseStorageDownloadTokens: tkn
                        }
                    }
                })
                stream.on('error', (err) => {
                    console.log(err)
                })
                stream.on('finish', () => {
                    mongoose.connection.useDb("lurien").collection("usernews").findOneAndUpdate(
                        { dni: parseInt(dni) },
                        { $set: { qrLink: link } }
                    )
                })
                stream.end(buff)
            })
        })
    } else {
        res.json({ message: { msgBody: "Chequea si los datos estan bien ingresados!", msgError: true } });
    }
    //mail shit
    const mailToken = uuid.v4()
    console.log(mailToken)
    temptoken(companyID, mail, mailToken)

});

async function temptoken(companyId, mail, token) {
    mongoose.connection.useDb("lurien").collection("temptoken")
    await TempTokenNew.findOne({ companyId }, (err) => {
        if (err)
            console.log('pinchamos :(')
        else {
            var newToken = new TempTokenNew({ token: token, mail: mail, companyID: companyId });
            console.log(newToken)
            newToken.save(err => {
                if (err) {
                    console.log('pincho')
                }
                else
                    console.log('tt creado uwuuu')
            })
        }
    })
    const text = `<p>hace click <a href="http://localhost:8080/api/user/validation/${token}" target="_blank">aqui</a></p>`
    console.log(token)
    mandarMail(mail, text)
}


userRouter.get('/ttget', async (req, res) => {
    const tokens = await TempTokenNew.find()
    if (tokens.length > 0) return res.json(tokens)
    else return res.send('owO?')
})

userRouter.get('/validation/:token', async (req, res) => {
    const token = req.params.token;
    console.log(token)
    // await TempTokenNew.findOne({ "token:": token })
    mongoose.connection.useDb("lurien").collection("temptokens")
    await TempTokenNew.findOneAndDelete({ token: token }, async function (err, docs) {
        if (err) {
            return res.json({ message: { msgBody: err } });
        }
        else {
            var mail = docs.toObject().mail
            await UserNew.findOneAndUpdate({mail}, {$set:{verMail:true}}, (err, doc, res)=>{
                if (err) return res.json(err)
                else return res.json({ message: { msgBody: "deleted the user " + docs } });
            })
            
        }
    });

})


userRouter.post('/login', passport.authenticate('local', { session: false }), async (req, res) => {
    if (req.isAuthenticated()) {
        const { _id, username, role, dni, companyID, mail, cantidadFotos, manArea, pfp, qrLink, modelLinks } = req.user;
        console.log("[LOGIN]", req.user.pfp)
        var extras = {
            dni: `${dni}.png`,
            dniB: String(dni)
        }
        const token = signToken(_id);
        var fbtkn = await adm.auth().createCustomToken(String(dni), extras)
        res.cookie('access_token', token, { httpOnly: true, sameSite: true });
        res.status(200).json({ isAuthenticated: true, user: { username, role, dni, companyID, mail, cantidadFotos, pfp, qrLink, manArea, modelLinks }, fbToken: fbtkn });
    }
});
userRouter.get('/logout', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.clearCookie('access_token');
    res.json({ user: { username: "", role: "", dni: "", companyID: "", mail: "", manArea: "", cantidadFotos: 0, pfp: "" }, success: true });
});

userRouter.get('/authenticated', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const { username, role, dni, companyID, mail, cantidadFotos, pfp, qrLink, modelLinks, manArea } = req.user;
    res.status(200).json({ isAuthenticated: true, user: { username, role, dni, modeloEntrenado: false, companyID, mail, manArea, cantidadFotos, pfp, qrLink, modelLinks } });
});


module.exports = userRouter;