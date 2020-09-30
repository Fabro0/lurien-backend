const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// const UserNew = require('./model/model');

const EventEmitter = require('events');
const Pusher = require("pusher")
class MyEmitter extends EventEmitter { }
const phite = new MyEmitter();


var pusher = new Pusher({
    appId: '1082208',
    key: 'b103ad2b1e20a1198455',
    secret: '5ddd5781b85de3eed2d7',
    cluster: 'us2',
    encrypted: true
  });
  
  app.use("/debug/:companyid", async (req, res) => {
    const { companyid } = req.params
    // phite.emit('update');
    let nombres = ["brenda","tievo","benatize","gati","fabro"]
    let name = nombres[Math.floor(Math.random() * nombres.length)];
    let hour = Date.now()
    pusher.trigger(companyid, 'my-event', {
      'name':  name,
      'hora': hour
    });
    res.json({  companyid ,name,hour})
  
  })

const uri = "mongodb+srv://tievo:sdBVjd8GQGsw6Jag@lurien.1yjjv.mongodb.net/lurien?retryWrites=true&w=majority";
// const uri = 'mongodb://localhost:27017/lurien'
app.use(express.static(path.join(__dirname, 'client/build')))
app.use(cookieParser());
app.use(express.json());
app.use(cors());

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }, (err) => {
    // if (err) throw new Error(err)
    console.log('conectadisimo con la base de padre, datos');
});
const userRouter = require('./routes/User');
const routerUpload = require('./routes/Photos');
const routerQR = require('./routes/qr');
app.use('/api/user', userRouter);
app.use('/api/upload',routerUpload);
app.use('/api/qr',routerQR);


app.listen(8080, () => {
    console.log('arriba el backend padre');
}); 