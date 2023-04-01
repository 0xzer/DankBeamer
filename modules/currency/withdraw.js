const {SlashCommandBuilder, EmbedBuilder, Embed} = require('discord.js');
const { invisibleEmbed } = require('../../data/settings.json');

module.exports = {
	cooldown: 1000,
	group: "withdraw",
	data: new SlashCommandBuilder()
		.setName('withdraw')
		.setDescription("Withdraw money from your bank into your pocket.")
		.addStringOption(amount => amount.setName('amount').setDescription('A constant number like "1234", a shorthand ("2k"), or a relative keyword like "30%" or "max".').setRequired(true)),
	async execute(interaction) {
        let amount = interaction.options.getString("amount");
        let player = await interaction.client.database.getPlayer(interaction.user.id);
        const embed = new EmbedBuilder();
        let parsed = await interaction.client.methods.parseAmount(player.wallet,amount);
        
        if (!parsed) {
            embed.setColor("Red");
            embed.setDescription(`That was an invalid amount`);
            return await interaction.reply({
                embeds: [embed]
            });
        }
        if (parsed > player.bank) {
            embed.setColor("Red");
            embed.setDescription(`You're trying to withdraw more than you've got in your bank!`);
            return await interaction.reply({
                embeds: [embed]
            });
        };
        embed.setColor(invisibleEmbed);
        embed.addFields(
            {name: "Withdrawn", value: `${interaction.client.symbols.money} ${parsed.toLocaleString()}`},
            {name: "Current Wallet Balance", value: `${interaction.client.symbols.money} ${(player.wallet+parsed).toLocaleString()}`, inline: true},
            {name: "Current Bank Balance", value: `${interaction.client.symbols.money} ${(player.bank-parsed).toLocaleString()}`, inline: true},
        );
        await interaction.client.database.addCoins(interaction.user.id,parsed);
        await interaction.client.database.subtractCoinsBank(interaction.user.id,parsed);
        return await interaction.reply({
            embeds: [embed]
        });
	},
};
