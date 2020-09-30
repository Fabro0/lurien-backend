const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

/*
NO SE USA MAS PORQUE CAMBIAMOS A PUSHER-JS
*/

// const EventEmitter = require('events');
// const Pusher = require("pusher")
// class MyEmitter extends EventEmitter { }
// const phite = new MyEmitter();

/*
LA SEGUNDA ES PARA FABRO / LOCALHOST 
*/

// const uri = "mongodb+srv://tievo:sdBVjd8GQGsw6Jag@lurien.1yjjv.mongodb.net/lurien?retryWrites=true&w=majority";
const uri = 'mongodb://localhost:27017/lurien'

app.use(express.static(path.join(__dirname, 'client/build')))
app.use(cookieParser());
app.use(express.json());
app.use(cors());

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }, (err) => {
    if (err) console.log("[DATABSE] -",err)
    console.log('[DATABASE] - conectado a mongo');
});

app.use('/api/user', require('./routes/User'));
app.use('/api/upload',require('./routes/Photos'));
app.use('/api/qr',require('./routes/qr'));
app.use('/api/debug',require('./routes/entradas'));


app.listen(8080, () => {
    console.log('[BACKEND] - servidor corriendo');
}); 