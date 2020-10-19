const mongoose = require('mongoose');

const AdminData = new mongoose.Schema({
    areas: {
        type: [String]
    }
});

module.exports = mongoose.model('AdminData', AdminData);
//uwu