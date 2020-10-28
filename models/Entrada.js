const mongoose = require('mongoose');

const EntradasSchema = new mongoose.Schema({
    dni: {
        type: Number
    },
    hora: {
        type: String 
    },
    img: {
        type: String
    },
    companyID:{
        type:String,
    }
});

module.exports = mongoose.model('Entradas', EntradasSchema);
