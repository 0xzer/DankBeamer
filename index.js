const Terminal = require('./terminal-js');
const { readdirSync, readdir } = require('fs');
const { connect } = require ("mongoose");
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessages,GatewayIntentBits.GuildMessageReactions,GatewayIntentBits.MessageContent] });
const symbols = require('./data/symbols.json');
const { token, mongoUri } = require('./data/settings.json');
const registerSlashCommands = require('./util/deplay-commands');

const Database = require('./classes/database');
const Methods = require('./classes/methods');

client.aliases = new Collection();
client.cooldowns = new Collection();
client.commands = new Collection();
client.symbols = symbols;

(async() => {
    client.logger = new Terminal();
    await registerSlashCommands();
    await registerEvents("./events")
    await registerCommands("./modules");

    client.connection = await connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    client.methods = new Methods();
    client.database = new Database(client.methods);
    await client.login(token);
})();


async function registerEvents(p) {
    const eventFiles = readdirSync(p).filter(file => file.endsWith('.js'));
    const eventsPath = path.join(__dirname, 'events');

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.run(client, ...args));
        } else {
            client.on(event.name, (...args) => event.run(client, ...args));
        }
    }
}

async function registerCommands(path = join(process.cwd(), path)) {
    let modules = readdirSync(path)
    for (let mod of modules) {
        let moduleDir = readdirSync(`${path}/${mod}`);
        for(let command of moduleDir) {
            let commandFile = require(`${path}/${mod}/${command}`);
            client.commands.set(commandFile.data.name/* name */, commandFile /* func */);
        }
    }
    client.logger.success(`Loaded ${client.commands.size} commands`, path.split("/")[1])
}