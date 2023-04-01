const multipliers = require('../data/multipliers.json');
const items = require('../data/items.json');
const { unabbreviateNumber } = require("js-abbreviation-number");

const amountRegex = /[0-9]*(m|k|b)/g
const amountRegexPercent = /[0-9]*%/g

let itemDrops = {
    "beg": require('../data/drops/beg.json')
};

let lootBoxes = {
    "meme": require('../data/boxes/memebox.json'),
    "normie": require('../data/boxes/normiebox.json')
}

class Methods {
    constructor() {

    };

    getEmojiString(itemKey, emojis) {
        let emoji = emojis[itemKey];
        return emoji.gif ? `<a:${emoji.name}:${emoji.id}>` : `<:${emoji.name}:${emoji.id}>`;
    }

    async parseUserMultipliers(type, currMultipliers) {
        let arr = [];
        let percentageMultiplierValue = 0;
        let multiplyMultiplierValue = 0;
        for(let i = 0; i < currMultipliers.length; i++) {
            let multiplier = multipliers[currMultipliers[i]];
            if (multiplier.type !== type) continue;
            arr.push(multiplier);
            if (type === "coins") {
                percentageMultiplierValue += multiplier.by;
            } else if (type === "xp") {
                multiplyMultiplierValue += multiplier.by;
            };
        };
        return {
            multipliers: arr,
            multiplyMultiplierValue: multiplyMultiplierValue,
            percentageMultiplierValue: percentageMultiplierValue
        };
    };

    async getCoinMultiplier(mps) {
        let initialValue = 0;
        let realMultipliers = [];
        let number = mps.reduce(
            (accumulator, currentValue) => {
                if (multipliers[currentValue].type === "coins") {
                    realMultipliers.push(multipliers[currentValue]);
                    return accumulator+multipliers[currentValue].by;
                };
                return accumulator+0
            },
            initialValue
        );
        return {
            multipliers: realMultipliers,
            percentageMultiplierValue: number
        };
    }

    async calculateCoinsWithMultipliers(percentage, originalAmount) {
        return Math.floor((originalAmount/100)*percentage);
    };

    async randomItem(rarity) {
        let itemsToUse = items.items;
        if (rarity) {
            itemsToUse = items.items.filter(i => i.rarity === rarity);
        };

        if (!rarity) {

        };
    };

    async getEmojiUrl(itemKey, emojis) {
        let emoji = emojis[itemKey];
        return emoji.gif ? `https://cdn.discordapp.com/emojis/${emoji.id}.gif` : `https://cdn.discordapp.com/emojis/${emoji.id}.png`
    }

    async rewardPicker(type, items) {
        let itemsList = itemDrops[type];
        if (items) itemsList = items;
        let chances = [];
        const sum = itemsList.reduce(
            (prev, curr) => prev + curr.percent,
            0
        );
        let acc = 0;
        chances = itemsList.map(
            ({ percent }) => (acc = percent + acc)
        );
        const rand = Math.random() * sum;
        const itemIndex = chances.filter((el) => el <= rand)
            .length;
        const result = itemsList.find(
            (_, index) => index === itemIndex
        );
        if (!result.items) return result;
        let item = result.items[Math.floor(Math.random() * result.items.length)];
        if (!item) return false;
        if (item.max) {
            return item;
        };
        return items.items.find(i => i.id === item);
    };

    async getLootBoxItems(itemKey) {
        return lootBoxes[itemKey];
    }

    async randomInRange(min, max) {  
        return Math.floor(Math.random() * (max - min) + min)
    };

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    async parseItemsById(playerItems) {
        playerItems.map(i => {
            let item = items.items.find(item => item.id === i.id);
            i.itemKey = item.itemKey;
            i.type = item.type;
            i.name = item.name;
        });
        return playerItems;
    };

    async parseAmount(total,str) {
        if (total > 0) {
            if (str === "max") str = total.toString();
            let isPercent = str.match(amountRegexPercent);
            if (isPercent) {
                let percentage = parseInt(isPercent[0]);
                if (isNaN(percentage)) return false;
                if (percentage > 100) return false;
                return Math.floor((total/100)*percentage);
            };
        }
        let isAbbreviation = str.match(amountRegex);
        if (isAbbreviation) {
            let Unabbreviated = await unabbreviateNumber(isAbbreviation[0]);
            if (isNaN(Unabbreviated)) return false;
            return Unabbreviated;
        };
        let num = parseInt(str);
        if (isNaN(num)) return false;
        return num;

    };

    
};

module.exports = Methods;