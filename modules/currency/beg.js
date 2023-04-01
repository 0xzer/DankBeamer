const {SlashCommandBuilder, EmbedBuilder, Embed} = require('discord.js');
const { invisibleEmbed, begMaxCoinReceieve, begDropItemChance } = require('../../data/settings.json');
const responses = require('../../data/beg_responses.json');


module.exports = {
	cooldown: 1000,
	group: "currency",
	data: new SlashCommandBuilder()
		.setName('beg')
		.setDescription("Beg for coins to help bolster your pocket balance."),
	async execute(interaction) {
        let acceptBeg = Math.round(Math.random());
        const embed = new EmbedBuilder();
        let author = responses.authors[Math.floor(Math.random() * responses.authors.length)];
        embed.setAuthor(author);
        if (acceptBeg) {
            let player = await interaction.client.database.getPlayer(interaction.user.id);
            let totalMultiplier = await interaction.client.methods.getCoinMultiplier(player.multipliers);
            let randomAmount = Math.floor(Math.random() * begMaxCoinReceieve)+1;
            const addedCoins = await interaction.client.database.addCoins(interaction.user.id, randomAmount, totalMultiplier);
            let begStr = `"Oh you poor soul, take ${interaction.client.symbols.money} **${addedCoins.total.toLocaleString()}**`;
            let dropItem = Math.random()
            if (dropItem <= begDropItemChance/100) {
                let item = await interaction.client.methods.rewardPicker("beg");
                if (item) {
                    if (item.max) {
                        let extraRandom = await interaction.client.methods.randomInRange(item.min,item.max);
                        begStr += " along with an extra " + `${interaction.client.symbols.money} **${extraRandom.toLocaleString()}**`;
                        await interaction.client.database.addCoins(interaction.user.id, extraRandom, false);
                    } else {
                        let emoji = interaction.client.itemEmojis[item.itemKey];
                        begStr += " and a " + `<:${emoji.name}:${emoji.id}> **${item.name}**`;
                        await interaction.client.database.addItem(interaction.user.id,item.id,1);
                    }
                }
            };
            embed.setDescription(begStr+' "');
            embed.setFooter({text:`Multi Bonus: +${totalMultiplier.percentageMultiplierValue}% (${interaction.client.symbols.money} ${addedCoins.multi.toLocaleString()})`});
            embed.setColor(invisibleEmbed);
            return await interaction.reply({
                embeds: [embed]
            });
        } else {
            embed.setDescription(`${responses.descriptions[Math.floor(Math.random() * responses.descriptions.length)]}`);
            embed.setFooter({text: "Imagine begging"})
            embed.setColor("Red");
            return await interaction.reply({
                embeds: [embed]
            });
        }
	},
};
