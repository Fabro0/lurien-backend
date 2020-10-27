const mongoose = require('mongoose');

const TempToken = new mongoose.Schema({
    token: {
        type: String
    },
    mail: {
        type: String //asumo que es un string??
    },
    companyID:{
        type:String,
    }
});

module.exports = mongoose.model('TempToken', TempToken);
//owo