const { Schema, model } = require('mongoose')

const user = Schema({
    id: Number,
    wallet: Number,
    bank: Number,
    bankMax: Number,
    multipliers: {
        default: [],
        type: Array,
    },
    items: Array,
    skinFragments: {
        default: 0,
        type: Number,
    }
});

module.exports = model('Users', user)