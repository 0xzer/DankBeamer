const {SlashCommandBuilder, EmbedBuilder, Embed} = require('discord.js');
const { invisibleEmbed } = require('../../data/settings.json');
const itemInfos = require('../../data/items.json');
const usableItems = require('../../data/items.json').items.filter(i => i.flags.CONSUMABLE);
const coinsDrop = require('../../data/boxes/coins.json');

module.exports = {
	cooldown: 1000,
	group: "currency",
	data: new SlashCommandBuilder()
		.setName('use')
		.setDescription("Use currency items that you own.")
		.addStringOption(item => 
            item.setName("item")
            .setDescription("Select an item")
            .setRequired(true)
            .setAutocomplete(true))
        .addStringOption(quantity => 
                quantity.setName("quantity")
                .setDescription('Amount of items you want to use when possible.')),
	async execute(interaction) {
        let item = interaction.options.getString("item");
        let fullItem = usableItems.find(i => i.itemKey === item);
        let quantity = interaction.options.getString("quantity");
        let player = await interaction.client.database.getPlayer(interaction.user.id);
        let playerItems = player.items;
        let playerItem = playerItems.find(i => i.id === fullItem.id);
        if (!quantity) quantity = "1";
        quantity = await interaction.client.methods.parseAmount(false,quantity);
        const embed = new EmbedBuilder();
        if (!quantity) {
            embed.setColor("Red");
            embed.setDescription(`That was an invalid amount to use!`);
            return await interaction.reply({
                embeds: [embed]
            });
        };
        if (!playerItem) {
            embed.setColor("Red");
            embed.setDescription(`You do not even own that item...`);
            return await interaction.reply({
                embeds: [embed]
            });
        };
        if (playerItem.amount < quantity) {
            embed.setColor("Red");
            embed.setDescription(`You don't have enough quantity of that item.`);
            return await interaction.reply({
                embeds: [embed]
            });
        }
        
        let type = fullItem.type;
        if (type === "Loot Box") {
            await interaction.client.database.removeItem(interaction.user.id,fullItem.id,quantity);
            let itemsRewardStr = "";
            let items = await interaction.client.methods.getLootBoxItems(fullItem.itemKey);
            let rewards = [];
            let totalCoins = 0;
            for(let i = 0; i < quantity; i++) {
                let coinRandom = coinsDrop[fullItem.itemKey];
                let randomCoins = await interaction.client.methods.randomInRange(coinRandom.min,coinRandom.max);
                totalCoins += randomCoins;
                let reward = await interaction.client.methods.rewardPicker(false,items);
                let rewardFullItem = itemInfos.items.find(i => i.id === reward.id);
                let min = reward.minAmount;
                let max = reward.maxAmount;
                let amount = await interaction.client.methods.randomInRange(min,max);
                let found = rewards.find(i => i.id === reward.id);
                if (found) {
                    found.amount += amount;
                } else {
                    rewards.push({
                        id: reward.id,
                        itemKey: reward.itemKey,
                        amount: amount,
                        name: rewardFullItem.name
                    });
                };
            };
            for(let reward of rewards) {
                itemsRewardStr += `\` ${reward.amount}x \` ${interaction.client.methods.getEmojiString(reward.itemKey,interaction.client.itemEmojis)}${reward.name}\n`
            };
            let coinsRewardStr = `${interaction.client.symbols.money} ${totalCoins.toLocaleString()}`
            let thumbnail = await interaction.client.methods.getEmojiUrl(fullItem.itemKey,interaction.client.itemEmojis);
            embed.setColor("#45991c");
            embed.setThumbnail(thumbnail);
            embed.setAuthor({name: `${interaction.user.username}'s Loot Haul!`, iconURL: interaction.user.avatarURL({})});
            embed.setDescription(`
            **Coins:**\n\` ${coinsRewardStr} \`

            **Items:**\n${itemsRewardStr}
            `);
            embed.setFooter({text: `${quantity}x ${fullItem.name} opened`});
            await interaction.client.database.addItems(interaction.user.id,rewards);
            await interaction.client.database.addCoins(interaction.user.id,totalCoins,false);
            return await interaction.reply({
                embeds: [embed]
            });
        };

	},
    autocomplete: async function(interaction) {
		const focusedValue = interaction.options.getFocused();
        if (focusedValue.length <= 0) {
            return await interaction.respond(
                usableItems.slice(0,24).map(choice => ({ name: choice.name, value: choice.itemKey })),
            );
        };
		let filtered = usableItems.filter(choice => choice.name.toLowerCase().includes(focusedValue.toLowerCase()) || choice.itemKey.toLowerCase().includes(focusedValue.toLowerCase()));
        if (filtered.length > 25) {
            filtered = filtered.slice(0,24);
        }
		await interaction.respond(
			filtered.map(choice => ({ name: choice.name, value: choice.itemKey })),
		);
	},
};
