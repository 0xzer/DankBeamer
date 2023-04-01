const {SlashCommandBuilder, EmbedBuilder, Embed} = require('discord.js');
const { invisibleEmbed } = require('../../data/settings.json');
const itemInfos = require('../../data/items.json');

module.exports = {
	cooldown: 1000,
	group: "currency",
	data: new SlashCommandBuilder()
		.setName('additem')
		.setDescription("Add an item to someone.")
        .addStringOption(item => item.setName("item").setDescription("Select an item").setRequired(true).setAutocomplete(true))
		.addUserOption(user => user.setName('user').setDescription("The user who you wish to add the item to."))
        .addNumberOption(amount => amount.setName("amount").setDescription("The x amount of the item to add")),
	async execute(interaction) {
		let user = interaction.options.getUser('user');
		if (!user) user = interaction.user;
        let item = interaction.options.getString("item");
        let embed = new EmbedBuilder();
        let fullItem = itemInfos.items.find(i => i.itemKey === item);
        if (!fullItem) {
            embed.setColor("Red");
            embed.setDescription(`The item specified does not exist!`);
            return await interaction.reply({
                embeds: [embed]
            });
        }
        let itemID = fullItem.id;
        let amount = interaction.options.getNumber("amount");
        if (!amount) amount = 1;

        let addedItem = await interaction.client.database.addItem(user.id,itemID,amount);
        if (addedItem.res.ok) {
            embed.setColor(invisibleEmbed);
            embed.setDescription(`Success! ${interaction.client.methods.getEmojiString(addedItem.item.itemKey,interaction.client.itemEmojis)} (\`x${amount}\`) has been added to ${user.toString()}'s inventory`);
            return await interaction.reply({
                embeds: [embed]
            })
        } else {
            embed.setColor("Red");
            embed.setDescription(`Failed to add the item(s)! \`${JSON.stringify(addedItem)}\``);
            return await interaction.reply({
                embeds: [embed]
            })
        };
	},
    autocomplete: async function(interaction) {
		const focusedValue = interaction.options.getFocused();
        if (focusedValue.length <= 0) {
            return await interaction.respond(
                itemInfos.items.slice(0,24).map(choice => ({ name: choice.name, value: choice.itemKey })),
            );
        };
		let filtered = itemInfos.items.filter(choice => choice.name.toLowerCase().includes(focusedValue.toLowerCase()) || choice.itemKey.toLowerCase().includes(focusedValue.toLowerCase()));
        if (filtered.length > 25) {
            filtered = filtered.slice(0,24);
        }
		await interaction.respond(
			filtered.map(choice => ({ name: choice.name, value: choice.itemKey })),
		);
	},
};
