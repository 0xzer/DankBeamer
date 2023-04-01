const { Events } = require('discord.js');
const { connect } = require ("mongoose");
module.exports = {
	name: Events.ClientReady,
	once: true,
	async run(client) {
		await client.database.updateShop();
		client.logger.success(`Ready! Logged in as ${client.user.tag}`);
		client.itemEmojis = {};
		for(let [key, val] of client.emojis.cache) {
			client.itemEmojis[val.name] = {name:val.name,id:key,gif:val.animated};
		};
    }
};