const { Schema, model } = require('mongoose')

const shop = Schema({
    specialOffer: Object,
    stocks: Array,
    lastReset: Number
});

module.exports = model('Shop', shop)