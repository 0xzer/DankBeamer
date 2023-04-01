const {SlashCommandBuilder, EmbedBuilder, Embed} = require('discord.js');
const { invisibleEmbed } = require('../../data/settings.json');
const Paging = require('../../classes/paging');

module.exports = {
	cooldown: 1000,
	group: "currency",
	data: new SlashCommandBuilder()
		.setName('multipliers')
		.setDescription("Check your current coin & xp multipliers within the bot.")
        .addSubcommand(subcommand =>
            subcommand
                .setName('coins')
                .setDescription('Check your current coin multipliers within the bot.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('xp')
                .setDescription('Check your current xp multipliers within the bot.')),
	async execute(interaction) {
        const subCommand = interaction.options.getSubcommand();
        let description = "";
        const player = await interaction.client.database.getPlayer(interaction.user.id);
        const multipliers = await interaction.client.methods.parseUserMultipliers(subCommand,player.multipliers);
        const embed = new EmbedBuilder();
        embed.setTitle("Your Multipliers");
        embed.setColor(invisibleEmbed);
        if (!multipliers.multipliers.length) {
            embed.setDescription(`XP Multiplier: \` ${multipliers.multiplyMultiplierValue}x \``);
            return interaction.reply({
                embeds: [embed]
            });
        };
        if (subCommand === "coins") {
            const paginator = new Paging(multipliers.multipliers,10,interaction);
            
            await paginator.paginate();
            const multiplierStr = paginator.paginatedItems[paginator.currentPage-1].items.map((i, index) => `\` ${" ".repeat(index)}+${i.by}% \` ${i.text}`).join("\n");
            description = `
            Coin Multiplier: \` +${multipliers.percentageMultiplierValue}% \`

            ${multiplierStr}
            `;
            embed.setDescription(description);
            await paginator.paginatorBegin(embed);
        } else if (subCommand === "xp") {
            const paginator = new Paging(multipliers.multipliers,10,interaction);
            
            await paginator.paginate();
            const multiplierStr = paginator.paginatedItems[paginator.currentPage-1].items.map(i => `\` ${i.by}x \` ${i.text}`).join("\n");
            description = `
            XP Multiplier: \` ${multipliers.multiplyMultiplierValue}x \`

            ${multiplierStr}
            `;
            embed.setDescription(description);
            await paginator.paginatorBegin(embed);
        }
	},
};
