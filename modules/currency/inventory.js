const {SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ComponentType } = require('discord.js');
const { invisibleEmbed } = require('../../data/settings.json');
const Paging = require('../../classes/paging');
const { categories } = require('../../data/items.json');
module.exports = {
	cooldown: 1000,
	group: "currency",
	data: new SlashCommandBuilder()
		.setName('inventory')
		.setDescription("View somebody's inventory. Leave the user argument empty to view your own.")
		.addUserOption(user => user.setName('user').setDescription("The user who's inventory you want to see."))
        .addNumberOption(page => page.setName('page').setDescription("The page you want to start with.")),
	async execute(interaction) {
		let user = interaction.options.getUser('user');
        let page = interaction.options.getNumber('page');

        if (!page) page = 1;
        if (!user) user = interaction.user;

        let player = await interaction.client.database.getPlayer(user.id);
        let items = await interaction.client.methods.parseItemsById(player.items);
        items = items.filter(i => i.amount > 0);
        let sortedTimes = 0;
        const paginator = new Paging(items,5);
        await paginator.paginate();
        let embed = new EmbedBuilder();
        embed = await getInventoryEmbed(embed,paginator.paginatedItems,paginator.currentPage,paginator.maxPage,interaction.client);
        embed.setColor(invisibleEmbed);
        embed.setAuthor({name: `${user.tag}'s inventory`, iconURL: user.avatarURL({})});
        embed.setFooter({text: `Page ${paginator.currentPage} of ${paginator.maxPage}`});
        let selectMenu = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder()
        .setCustomId('filter')
        .setMaxValues(5)
        .setPlaceholder('Make a selection')
        .addOptions(
            {label:"All",value:"all",default:true},
            {label:"Loot Box",value:"loot box",default:false},
            {label:"Pack",value:"pack",default:false},
            {label:"Power-up",value:"power-up",default:false},
            {label:"Sellable",value:"sellable",default:false},
            {label:"Tool",value:"tool",default:false},
            {label:"Consumable",value:"consumable",default:false},
            {label:"Collectable",value:"collectable",default:false}
        ));
        let message = await interaction.reply({
            embeds: [embed],
            components: [selectMenu,paginator.components]
        });
        let defaultIndex = selectMenu.components[0].options.findIndex(c => c.data.value === "all");
        selectMenu.components[0].options[defaultIndex].data.default = false;
        let uid = interaction.user.id;
        const filter = i => {
            return i.user.id === uid;
        };
        const collector = await message.createMessageComponentCollector({filter, componentType: ComponentType.Button, time: 120000 });
        const sortCollector = await message.createMessageComponentCollector({filter, componentType: ComponentType.StringSelect, time: 120000 });

        sortCollector.on('collect', async (i) => {
            if (sortedTimes === 0 && i.values.includes("all") && i.values.length > 1) {
                i.values.shift();
                sortedTimes++;
            };
            let filteredItems;
            if (!i.values.includes("all")) {
                filteredItems = paginator.items.filter(c => i.values.includes(c.type.toLowerCase()));
            } else {
                i.values = ["all"];
                filteredItems = paginator.items;
            };
            const paginatorSorted = new Paging(filteredItems,5);
            await paginatorSorted.paginate();
            paginator.currentPage = 1;
            paginator.maxPage = paginatorSorted.paginatedItems.length;
            paginator.paginatedItems = paginatorSorted.paginatedItems;
            let options = selectMenu.components[0].options;
            for(let d = 0; d < options.length; d++) {
                if (i.values.includes(options[d].data.value)) {
                    selectMenu.components[0].options[d].data.default = true;
                } else {
                    selectMenu.components[0].options[d].data.default = false;
                }
            };
            embed = await getInventoryEmbed(embed,paginator.paginatedItems,paginator.currentPage,paginator.maxPage,interaction.client);
            await i.update({
                embeds: [embed],
                components: [selectMenu,paginator.components]
            });
        });

        collector.on('collect', async (i) => {
            if (i.customId === "forwardSmall") {
                paginator.currentPage++;
            } else if (i.customId === "forward") {
                paginator.currentPage+=2;
            } else if (i.customId === "backSmall") {
                paginator.currentPage--;
            } else if (i.customId === "back") {
                paginator.currentPage-=2;
            };
            if (paginator.currentPage <= 1) {
                await paginator.disableComponents("back");
                await paginator.disableComponents("backSmall");
            } else {
                if (paginator.currentPage > 2) {
                    await paginator.enableComponents("back");
                };
                await paginator.enableComponents("backSmall");
            };

            if (paginator.currentPage >= paginator.maxPage) {
                paginator.currentPage = paginator.maxPage;
                await paginator.disableComponents("forward");
                await paginator.disableComponents("forwardSmall");
            } else {
                if (paginator.currentPage+2 > paginator.maxPage) {
                    await paginator.disableComponents("forward");
                } else {
                    await paginator.enableComponents("forward");
                };
                await paginator.enableComponents("forwardSmall");
            };
            if (paginator.currentPage < 1) {
                paginator.currentPage = 1;
            }
            embed = await getInventoryEmbed(embed,paginator.paginatedItems,paginator.currentPage,paginator.maxPage,interaction.client);
            await i.update({
                embeds: [embed],
                components: [selectMenu,paginator.components]
            });
        });
    },
};


async function getInventoryEmbed(embed, items, page, maxPage, client, sortBy) {
    let str = "";
    if (items.length) {
        items = items.find(p => p.page === page).items;
    } else {
        str += "No items found!"
    };
    if (maxPage === 0) maxPage = 1;
    items.map(item => {
        str += `${client.methods.getEmojiString(item.itemKey,client.itemEmojis)} **${item.name}** - ${item.amount}\n${item.type}\n\n`
    });
    embed.setDescription(str);
    embed.setFooter({text:`Page ${page} of ${maxPage}`})
    return embed;
};