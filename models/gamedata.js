const mongoose = require('mongoose');

const gamedataSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
    },
    id: {
        type: String,
        trim: true,
    },
    scenario: {
        type: String,
        trim: true,
    },
    currentStep: {
        type: String,
        trim: true,
    },
    reason: {
        type: String,
        trim: true,
    },
    choices: {
        type: Array,
    }
});

module.exports = mongoose.model('GameData', gamedataSchema);