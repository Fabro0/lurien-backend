const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
global.XMLHttpRequest = require("xhr2");
require('dotenv').config()

var serviceAccount = JSON.parse(process.env.firebaseAdmin)
var adm = require('firebase-admin')
adm.initializeApp({
    credential: adm.credential.cert(serviceAccount),
    databaseURL: 'https://test-lurien.firebaseio.com'
});
const uri = process.env.MONGO_URI;
//const uri = 'mongodb://localhost:27017/lurien'

app.use(express.static(path.join(__dirname, 'client/build')))
app.use(cookieParser());
app.use(express.json());
app.use(cors());

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }, async (err) => {
    if (err) console.log("[DATABSE] -",err)
    else console.log('[DATABASE] - conectado a mongo');
    
});

app.use('/api/user', require('./routes/User'));
app.use('/api/upload',require('./routes/Photos'));
app.use('/api/qr',require('./routes/qr'));
app.use('/api/entradas',require('./routes/entradas'));


app.listen(8080, () => {
    console.log('[BACKEND] - servidor corriendo');
}); 