const {SlashCommandBuilder, EmbedBuilder, Embed} = require('discord.js');
const { invisibleEmbed } = require('../../data/settings.json');

module.exports = {
	cooldown: 1000,
	group: "currency",
	data: new SlashCommandBuilder()
		.setName('pets')
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
