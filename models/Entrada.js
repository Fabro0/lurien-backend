const mongoose = require('mongoose');

const EntradasSchema = new mongoose.Schema({
    dni: {
        type: Number
    },
    hora: {
        type: String //asumo que es un string??
    },
    img: {
        type: String
    },
    companyID:{
        type:String,
    }
});

module.exports = mongoose.model('Entradas', EntradasSchema);
//hacer entradas and all that shit en atlas later 