const mongoose = require('mongoose');

const CompanyAreas = new mongoose.Schema({
    areas: {
        type: [String]
    },
    companyId: {
        type: String
    }
});

module.exports = mongoose.model('CompanyAreas', CompanyAreas);
//uwu