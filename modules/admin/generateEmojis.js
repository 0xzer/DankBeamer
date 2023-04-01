const {SlashCommandBuilder, EmbedBuilder, Embed} = require('discord.js');
const { invisibleEmbed } = require('../../data/settings.json');
const items = require('../../data/items.json').items;

module.exports = {
	cooldown: 1000,
	group: "admin",
	data: new SlashCommandBuilder()
		.setName('generateemojis')
		.setDescription("Generate all the emojis required.")
        .addStringOption(option => option.setName("guildid").setDescription("The guild ID to create the emojis in.")),
	async execute(interaction) {
		let guildId = interaction.options.getString('guildid');
        if (!guildId) guildId = interaction.guild.id;
        let guild = await interaction.client.guilds.cache.get(guildId);
        
		await interaction.reply({
			content: 'Creating emojis....'
		});
        for(let item of items) {
			if (interaction.client.emojis.cache.find(e => e.name === item.itemKey)) continue;
			let emojiCreated = await guild.emojis.create({
				attachment: item.imageURL,
				name: item.itemKey
			});
			await interaction.followUp(`Created ${emojiCreated.toString()} !`);
			await interaction.client.methods.delay(5000);
        };
	},
};
