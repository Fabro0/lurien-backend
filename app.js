const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dnname = 'testa'
const uri = "mongodb+srv://tievo:hU4s1oAElAanEEHu@lurien.1yjjv.mongodb.net/tievo?retryWrites=true&w=majority";
//aa
// const uri = 'mongodb://localhost:27017/lurien'
app.use(express.static(path.join(__dirname, 'client/build')))
app.use(cookieParser());
app.use(express.json());
app.use(cors());

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }, () => {
    console.log('conectadisimo con la base de padre, datos');
});
const userRouter = require('./routes/User');
const routerUpload = require('./routes/Photos');
const routerQR = require('./routes/qr');
app.use('/api/user', userRouter);
app.use('/api/upload',routerUpload);
app.use('/api/qr',routerQR);


app.listen(5000, () => {
    console.log('arriba el backend padre');
}); 