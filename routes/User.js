const express = require('express');
const userRouter = express.Router();
const passport = require('passport');
const passportConfig = require('../passport');
const JWT = require('jsonwebtoken');
const mongoose = require('mongoose')
const UserNew = require('../models/User');
const CompanyAreaNew = require('../models/CompanyAreas')
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
userRouter.get('/tool3/:dni', async (req, res) => {
    await UserNew.findOne({ dni: req.params.dni }, function (err, doc) {
        doc.area = "tu vieja"
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

//get all users area == area mandada && role == 'user' uwu
userRouter.get('/manUser', async (req, res) => {
    const {area} = req.body;
    const users = await UserNew.find({area:{ $eq: area}});
    if (users.length > 0) return res.json(users)
    else return res.send('uwudie')
})

userRouter.get('/mod', async (req, res) => {
    const users = await UserNew.find()
    return res.json(users)
})

userRouter.get('/deleteArea', async (req, res) => {
    const {companyId, area} = req.body;
    mongoose.connection.useDb("lurien").collection("companyareas")
    await CompanyAreaNew.findOne({companyId}, (err, company) =>{
        console.log(company.areas)
        if(err)
            return res.json({ message: { msgBody: "Hubo un error con el pedido al servidor, ya nos estamos encargando!",err, msgError: true } });
        
        else{
            var array = company.areas
            if (array.includes(area)){
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

userRouter.get('/retrieveArea/:companyId', async (req, res)=>{
    const {companyId} = req.params;
    console.log(companyId)
    await mongoose.connection.useDb("lurien").collection("companyareas").findOne({companyId}, (err, company) =>{
        if(err)
            return res.json({ message: { msgBody: "Hubo un error con el pedido al servidor, ya nos estamos encargando!",err, msgError: true } });
        else{
            if (!company){
                return res.json({ message: { msgBody: "Error area compania uwu", msgError: true } });
            }
            else{
                console.log(company)
                return res.json({ message: { msgBody: company.areas, msgError: false } });
            }
        }
    })
})



userRouter.post('/addArea', async (req, res)=>{
    const {companyId, areas} = req.body;
    console.log(companyId)
    mongoose.connection.useDb("lurien").collection("companyareas")
    await CompanyAreaNew.findOne({companyId}, (err, company) =>{
        if(err)
            return res.json({ message: { msgBody: "Hubo un error con el pedido al servidor, ya nos estamos encargando!",err, msgError: true } });
        else{
            if (!company){
                console.log(company)
                const newCompany = new CompanyAreaNew({areas:areas, companyId: companyId});
                console.log(newCompany)
                newCompany.save(err => {
                    if (err) {
                        return res.json({ message: { msgBody: "Hubo un error con el pedido al servidor, ya estamos solucionando!", msgError: true } });
                    }
                    else
                        return res.status(201).json({ message: { msgBody: "Company slot creado!", msgError: false } });
                })

            }
            else{
                var array = company.areas
                if (!array.includes(areas)){
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
    const { dni, companyID, role, mail, manArea, area } = req.body;
    var errorMan = false;
    mongoose.connection.useDb("lurien").collection("usernews").findOne({ dni }, (err, user) => {
        
        if (err)
            return res.json({ message: { msgBody: "Hubo un error con el pedido al servidor, ya nos estamos encargando!",err, msgError: true } });

        if (user)
            return res.json({ message: { msgBody: "Ese nombre o DNI ya esta existe en esta compañia!", msgError: true } });
        
        if (role != "manager" && manArea != null){
            errorMan = true;
            return res.json({ message: { msgBody: "Estas intentando asignarle un area a un noadmin", msgError: true } });
        }
        
        if (role == "manager" && manArea == null){
            errorMan = true;
            return res.json({ message: { msgBody: "No le asignaste un area de manejo al manager", msgError: true } });
        }

            
        else {
            console.log(errorMan)
            if(!errorMan){
                const newUser = new UserNew({ mail, dni, companyID, role, manArea, area});
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
        res.json({ message: { msgBody: "Chequea si los datos estan bien ingresados!", msgError: true } });
    }
});
userRouter.post('/login', passport.authenticate('local', { session: false }), async (req, res) => {
    if (req.isAuthenticated()) {
        const { _id, username, role, dni, companyID, mail, cantidadFotos,manArea, pfp, qrLink, modelLinks } = req.user;
        console.log("[LOGIN]", req.user.pfp)
        var extras = {
            dni: `${dni}.jpg`,
            dniB: String(dni)
        }
        const token = signToken(_id);
        var fbtkn = await adm.auth().createCustomToken(String(dni), extras)
        res.cookie('access_token', token, { httpOnly: true, sameSite: true });
        res.status(200).json({ isAuthenticated: true, user: { username, role, dni, companyID, mail, cantidadFotos, pfp, qrLink,manArea, modelLinks }, fbToken: fbtkn });
    }
});
userRouter.get('/logout', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.clearCookie('access_token');
    res.json({ user: { username: "", role: "", dni: "", companyID: "", mail: "",manArea:"", cantidadFotos: 0, pfp: "" }, success: true });
});

userRouter.get('/authenticated', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const { username, role, dni, companyID, mail, cantidadFotos, pfp, qrLink, modelLinks,manArea } = req.user;
    res.status(200).json({ isAuthenticated: true, user: { username, role, dni, modeloEntrenado: false, companyID, mail,manArea, cantidadFotos, pfp, qrLink, modelLinks } });
});


module.exports = userRouter;