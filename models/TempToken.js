const mongoose = require('mongoose');

const TempToken = new mongoose.Schema({
    createdAt:{
        type: Date
    },
    token: {
        type: String
    },
    mail: {
        type: String //asumo que es un string??
    },
    dni:{
        type:Number
    },
    companyID:{
        type:String
    }
});

module.exports = mongoose.model('TempToken', TempToken);
//owo