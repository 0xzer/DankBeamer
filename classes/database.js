const User = require('../schemas/user');
const Shop = require('../schemas/shop');
const multipliers = require('../data/multipliers.json');
const items = require('../data/items.json');
const purchaseableItems = items.items.filter(c=>c.flags.PURCHASEABLE);


class Database {
    constructor(methods) {
        this.methods = methods;
    };

    async getPlayer(id) {
        let player = await User.findOne({id: id});
        if (!player) {
            let document = new User({
                id: id,
                wallet: 500,
                bank: 0,
                bankMax: 5000,
                multipliers: ["newUserLevel0"]
            });
            player = await document.save();
        };
        return player;
    };

    async addCoins(id, amount, multiplierInfo) {
        let extra;
        let total = amount;
        if (multiplierInfo) {
            if (multiplierInfo.multipliers.length) {
                extra = await this.methods.calculateCoinsWithMultipliers(multiplierInfo.percentageMultiplierValue, amount);
                total += extra;
            };
        } else {
            extra = 0;
        };
        await User.updateOne({
            id: id
        }, {$inc: {wallet: total}});

        return {
            multi: extra,
            amount: amount,
            total: total
        };
    };
    
    async subtractCoins(id, amount) {
        await User.updateOne({
            id: id
        }, {$inc: {wallet: -amount}});
        return true;
    }

    async removeItem(id, itemId, amount) {
        let player = await this.getPlayer(id);
        let currItems = player.items;
        let query;
        if (currItems.find(i => i.id === itemId)) {
            query = await User.updateOne({'items.id': itemId, 'id': `${id}`}, {'$inc': {'items.$.amount': -amount }});
        } else {
            return false;
        };
        return {
            res: query,
            item: items.items.find(i => i.id === itemId)
        }
    }

    async addItem(id, itemId, amount) {
        let player = await this.getPlayer(id);
        let currItems = player.items;
        let query;
        if (currItems.find(i => i.id === itemId)) {
            query = await User.updateOne({'items.id': itemId, 'id': `${id}`}, {'$inc': {'items.$.amount': amount }});
        } else {
            query = await User.updateOne({id: id}, {$push: {items: {id:itemId,amount:amount ? parseInt(amount) : 1}}});
        };
        return {
            res: query,
            item: items.items.find(i => i.id === itemId)
        }
    };

    async addItems(id, items) {
        let player = await this.getPlayer(id);
        let currItems = player.items;
        for(let i = 0; i < items.length; i++) {
            let itemId = items[i].id;
            let amount = items[i].amount;
            let query;
            if (currItems.find(i => i.id === itemId)) {
                query = await User.updateOne({'items.id': itemId, 'id': `${id}`}, {'$inc': {'items.$.amount': amount }});
            } else {
                query = await User.updateOne({id: id}, {$push: {items: {id:itemId,amount:amount ? parseInt(amount) : 1}}});
            };
        }
    }

    async addCoinsBank(id, amount) {
        await User.updateOne({
            id: id
        }, {$inc: {bank: amount}});
        return true;
    };

    async subtractCoinsBank(id, amount) {
        await User.updateOne({
            id: id
        }, {$inc: {bank: -amount}});
        return true;
    };

    async updateShop() {
        let currentShop = await Shop.findOne({});
        if (!currentShop) {
            let itemIDS = purchaseableItems.map(i => {
                let obj = {id:i.id,price:i.value,type:i.type};
                if (i.stock) {
                    obj.stock = i.stock;
                    obj.stockMax = i.stock;
                };
                return obj;
            });
            let document = new Shop({
                stocks: itemIDS,
                specialOffer: {},
                lastReset: Date.now()
            });
            await document.save();
            return true;
        };

        if (Date.now() >= currentShop.lastReset+3600000) {
            for(let i = 0; i < currentShop.stocks.length; i++) {
                if (currentShop.stocks[i].stock) {
                    currentShop.stocks[i].stock = currentShop.stocks[i].stockMax
                };
            };
            await Shop.updateOne({_id: currentShop._id}, {
                $set: {
                    stocks: currentShop.stocks,
                    lastReset: Date.now()
                }
            });
        };
    };

    async getCurrentShop() {
        let currentShop = await Shop.findOne({});
        return currentShop;
    };

    async removeStock(itemId, amount) {
        let currentShop = await this.getCurrentShop();
        let item = currentShop.stocks.find(s => s.id === itemId);
        if (!item.stock) return;
        let query = await Shop.updateOne({'stocks.id': itemId}, {'$inc': {'stocks.$.stock': -amount }});
        if (query.ok) {
            return true;
        } else {
            return false;
        };
    };
};


module.exports = Database;