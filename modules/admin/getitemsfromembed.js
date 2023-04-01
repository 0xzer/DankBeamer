const {SlashCommandBuilder, EmbedBuilder, Embed} = require('discord.js');
const { invisibleEmbed } = require('../../data/settings.json');
const items = require('../../data/items.json').items;
const fs = require('fs');
let hasNumberRegex = /[0-9]/g
module.exports = {
	cooldown: 1000,
	group: "admin",
	data: new SlashCommandBuilder()
		.setName('getitemsfromembed')
		.setDescription("jajajaja")
		.addStringOption(message => 
			message.setName("content")
			.setDescription("the content of the message to parse items from").setRequired(true)),
	async execute(interaction) {
		let boxItems = [];
        let content = interaction.options.getString("content").split(")").filter(c => c.length>0);
		for(let m of content) {
			m = m.trimLeft().trimRight();
			let splitUp = m.split(" ");
			let percentage = splitUp[0].split("%")[0];
			let itemKey = splitUp[3];
			let itemKey2 = splitUp[4];
			let item;
			let amountToGet = m.match(/\([0-9] - [0-9]|\([0-9]/g)[0].replace("(", "");
			
			let minAmount = amountToGet.split("-")[0];
			let maxAmount = amountToGet.split("-")[1];
			if (hasNumberRegex.test(itemKey2)) {
				item = items.find(i => i.name === itemKey);
			} else {
				item = items.find(i => i.name === itemKey+" "+itemKey2);
			};
			let saveObject = {
				"percent": parseFloat(percentage),
				"itemKey": item.itemKey,
				"id": item.id,
				"maxAmount": parseInt(maxAmount),
				"minAmount": parseInt(minAmount)
			};
			if (!maxAmount) {
				saveObject.maxAmount = parseInt(minAmount) 
			}
			boxItems.push(saveObject)
		}
		fs.writeFileSync("boxItems.json", JSON.stringify(boxItems))
	},
};
