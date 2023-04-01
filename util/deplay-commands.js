const { REST, Routes } = require('discord.js');
const { clientId, token } = require('../data/settings.json');
const fs = require('fs');
const path = require('path');

const commands = [];
const moduleFiles = fs.readdirSync('./modules');

for (const m of moduleFiles) {
    const commandList = fs.readdirSync(path.join(__dirname, "..", `/modules/${m}`))
    for(let cmd of commandList) {
        const command = require(`../modules/${m}/${cmd}`);
        commands.push(command.data.toJSON());
    }
}
const rest = new REST({ version: '10' }).setToken(token);
module.exports = (async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);
		const data = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
});