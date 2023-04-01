const {SlashCommandBuilder, EmbedBuilder, Embed} = require('discord.js');
const { invisibleEmbed } = require('../../data/settings.json');

module.exports = {
	cooldown: 1000,
	group: "currency",
	data: new SlashCommandBuilder()
		.setName('balance')
		.setDescription("See someone's balance. Pocket, bank, and net worth.")
		.addUserOption(user => user.setName('user').setDescription("The user who's balance you want to see.")),
	async execute(interaction) {
		let user = interaction.options.getUser('user');
		if (!user) user = interaction.user;
		let playerData = await interaction.client.database.getPlayer(user.id);
		let percentage = (100 * playerData.bank) / playerData.bankMax;
		let totalNet = playerData.bank+playerData.wallet;
		const embed = new EmbedBuilder();
		embed.setColor(invisibleEmbed);
		embed.setTitle(`${user.tag}'s Balance`);
		embed.setDescription(`
		
		**Wallet:** ${interaction.client.symbols.money} ${playerData.wallet.toLocaleString()}
		**Bank:** ${interaction.client.symbols.money} ${playerData.bank.toLocaleString()} / ${playerData.bankMax.toLocaleString()} (${percentage.toFixed(1)}%)


		**Total Net:** ${interaction.client.symbols.money} ${totalNet.toLocaleString()}
		`);

		return await interaction.reply({
			embeds: [embed]
		});
	},
};
