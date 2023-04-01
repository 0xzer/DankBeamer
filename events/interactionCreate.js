const { Events } = require('discord.js');
const { connect } = require ("mongoose");
module.exports = {
	name: Events.InteractionCreate,
	async run(client, interaction) {
		if (interaction.isAutocomplete()) {
			const command = interaction.client.commands.get(interaction.commandName);
			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			};
			try {
				await command.autocomplete(interaction);
			} catch (error) {
				console.error(error);
			};
		};
		if (!interaction.isChatInputCommand()) return;
		const command = interaction.client.commands.get(interaction.commandName);
		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		const hasCooldown = interaction.client.cooldowns.get(`${interaction.user.id}-${interaction.commandName}`);
		if (hasCooldown) {
			let now = Date.now();
			let canUseAt = hasCooldown.time;
			let stillHasCooldown = canUseAt-now
			if (stillHasCooldown > 0) return await interaction.reply({ephemeral: true, content: `⏲️ **|** You are still on cooldown for the command \`${interaction.commandName}\` for **${(stillHasCooldown/1000).toFixed(2)}s**`})
			interaction.client.cooldowns.delete(`${interaction.user.id}-${interaction.commandName}`)
			interaction.client.cooldowns.set(`${interaction.user.id}-${interaction.commandName}`, {time: Date.now()+command.cooldown})
		} else {
			interaction.client.cooldowns.set(`${interaction.user.id}-${interaction.commandName}`, {time: Date.now()+command.cooldown})
		}

		try {
			await command.execute(interaction);
		} catch (error) {
			interaction.client.logger.error(`Error executing ${interaction.commandName}`);
			console.error(error);
		}
    }
};