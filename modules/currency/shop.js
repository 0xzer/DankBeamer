const {SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ComponentType } = require('discord.js');
const { invisibleEmbed } = require('../../data/settings.json');
const Paging = require('../../classes/paging');
const itemInfos = require('../../data/items.json');
const purchaseableItems = itemInfos.items.map(i=>{ if (i.flags.PURCHASEABLE){return {name:i.name,value:i.itemKey}}}).filter(c=>c);
const sellableItems = itemInfos.items.map(i=>{ if (i.type === "Sellable" || i.type === "Collectable" || i.flags.PURCHASEABLE){return {name:i.name,value:i.itemKey}}}).filter(c=>c).sort();
module.exports = {
	cooldown: 1000,
	group: "currency",
	data: new SlashCommandBuilder()
		.setName('shop')
		.setDescription("See what's in the shop to buy or sell with your coins!")
		.addSubcommand(view => view.setName('view').setDescription("View all shop items."))
        .addSubcommand(buy => 
            buy.setName('buy')
            .setDescription("Buy an item.")
            .addStringOption(item => 
                item.setName("item")
                .setDescription("Select an item")
                .setRequired(true)
                .addChoices(...purchaseableItems)
            )
            .addStringOption(quantity => 
                quantity.setName("quantity")
                .setDescription('The amount of the item to purchase. A constant number like "123" or a shorthand like "2k"')
            )
            .addBooleanOption(coupon => 
                coupon.setName("coupon")
                .setDescription("Whether you want to use a coupon or not.")
            )
        )
        .addSubcommandGroup(sellGroup =>
            sellGroup.setName("sell")
            .setDescription("Sell items back to the shop!")
            .addSubcommand(all => 
                all.setName("all")
                .setDescription("Sell all sellable items.")
                .addStringOption(exclude1 => 
                    exclude1.setName("exclude_item_1")
                    .setDescription("Select an item")
                    .setAutocomplete(true)
                )
                .addStringOption(exclude2 => 
                    exclude2.setName("exclude_item_2")
                    .setDescription("Select an item")
                    .setAutocomplete(true)
                )
                .addStringOption(exclude3 => 
                    exclude3.setName("exclude_item_3")
                    .setDescription("Select an item")
                    .setAutocomplete(true)
                )
            )
            .addSubcommand(item => 
                item.setName("item")
                .setDescription("Sell an item")
                .addStringOption(itemToSell => 
                    itemToSell.setName("item")
                    .setDescription("Select an item")
                    .setAutocomplete(true)
                    .setRequired(true)
                )
                .addStringOption(quantity => 
                quantity.setName("quantity")
                .setDescription('A constant number like "1234" or a shorthand ("2k")')
                )
            )
        ),
	async execute(interaction) {
        let subCommand = interaction.options.getSubcommand();
        let subCommandGroup = interaction.options.getSubcommandGroup();
        let player = await interaction.client.database.getPlayer(interaction.user.id);
        let currentShop = await interaction.client.database.getCurrentShop();
        currentShop.stocks.sort((a,b) => a.price-b.price);
        let embed = new EmbedBuilder();
        if (subCommand === "buy") {
            let itemKey = interaction.options.getString("item");
            let item = itemInfos.items.find(i => i.itemKey === itemKey);
            let quantity = interaction.options.getString("quantity");
            if (!quantity) quantity = "1";
            let coupon = interaction.options.getBoolean("coupon");
            let quantityParsed = await interaction.client.methods.parseAmount(-1,quantity);
            let price = item.value*quantityParsed;
            if (price > player.wallet) {
                embed.setColor("Red");
                embed.setDescription(`You do not have enough money in your pocket to purchase that! you have ${interaction.client.symbols.money}\`${player.wallet.toLocaleString()}\` which means you need ${interaction.client.symbols.money}\`${(price-player.wallet).toLocaleString()}\` more`);
                return await interaction.reply({
                    embeds: [embed]
                });
            };
            let stock = currentShop.stocks.find(s => s.id === item.id);
            if (quantityParsed > stock.stock) {
                embed.setColor("Red");
                embed.setDescription(`There isn't this many items in this hour's stock bro.\nYou should check the market!`);
                return await interaction.reply({
                    embeds: [embed]
                });
            };
            await interaction.client.database.removeStock(item.id,quantityParsed);
            await interaction.client.database.subtractCoins(interaction.user.id,price);
            await interaction.client.database.addItem(interaction.user.id,item.id,quantityParsed);
            embed.setColor(invisibleEmbed);
            embed.setDescription(`${interaction.user.toString()} bought **${quantityParsed.toLocaleString()}x** ${interaction.client.methods.getEmojiString(itemKey,interaction.client.itemEmojis)}**${item.name}** and paid ${interaction.client.symbols.money} **${price.toLocaleString()}**`)
            embed.setFooter({text: "Thanks for your purchase!"});
            embed.setAuthor({iconURL: interaction.user.avatarURL({}), name: `Successful ${item.name} purchase`});
            return await interaction.reply({
                embeds: [embed],
            });
        } else if (subCommand === "view") {
            let sortedTimes = 0;
            let paginator = new Paging(currentShop.stocks,8);
            await paginator.paginate();
            embed = await getShopEmbed(embed,paginator.paginatedItems,paginator.currentPage,paginator.maxPage,interaction.client,player.items);
            if (paginator.maxPage === 1) {
                await paginator.disableComponents();
            };
            embed.setColor(invisibleEmbed);
            embed.setTitle("Shop");
            let selectMenu = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder()
            .setCustomId('filter')
            .setMaxValues(5)
            .setPlaceholder('Make a selection')
            .addOptions(
                {label:"All",value:"all",default:true},
                {label:"Pack",value:"pack",default:false},
                {label:"Power-up",value:"power-up",default:false},
                {label:"Tool",value:"tool",default:false},
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
                const paginatorSorted = new Paging(filteredItems,8);
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
                if (paginator.maxPage === 1) {
                    await paginator.disableComponents();
                } else {
                    if (paginator.currentPage+2 > paginator.maxPage) {
                        await paginator.disableComponents("forward");
                    } else {
                        await paginator.enableComponents("forward");
                    };
                    await paginator.enableComponents("forwardSmall");
                };
                embed = await getShopEmbed(embed,paginator.paginatedItems,paginator.currentPage,paginator.maxPage,interaction.client,player.items);
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
                embed = await getShopEmbed(embed,paginator.paginatedItems,paginator.currentPage,paginator.maxPage,interaction.client,player.items);
                await i.update({
                    embeds: [embed],
                    components: [selectMenu,paginator.components]
                });
            });
        } else if (subCommandGroup === "sell") {
            if (subCommand === "all") {
                let excludedItems = [interaction.options.getString("exclude_item_1"),interaction.options.getString("exclude_item_2"),interaction.options.getString("exclude_item_3")];
                let toSell = await getItemsToSell(excludedItems,player.items.filter(i => i.amount > 0));
                if (!toSell.length) {
                    embed.setDescription("You don't have any Sellable type items (that you didn't exclude).");
                    return await interaction.reply({
                        embeds: [embed]
                    });
                };
                let fullAmount = toSell.reduce((previousValue, currentValue) => previousValue + (currentValue.price*currentValue.amount), 0);
                for(let s = 0; s < toSell.length; s++) {
                    await interaction.client.database.removeItem(interaction.user.id,toSell[s].id,toSell[s].amount);
                };
                await interaction.client.database.addCoins(interaction.user.id,fullAmount,false);
                embed.setDescription(`${interaction.user.toString()} sold ${toSell.map(i => `x${i.amount} ${interaction.client.methods.getEmojiString(i.itemKey,interaction.client.itemEmojis)}${i.name}`)} and got paid ${interaction.client.symbols.money} **${fullAmount.toLocaleString()}**`)
                embed.setFooter({text: "Thank you for your meme business"});
                embed.setTitle(`${interaction.user.username}'s Sale Receipt`);
                await interaction.reply({
                    embeds: [embed],
                });
            } else if (subCommand === "item") {
                let item = interaction.options.getString("item");
                let quantity = interaction.options.getString("quantity");
                if (!quantity) quantity = "1";
                let quantityParsed = await interaction.client.methods.parseAmount(-1,quantity);
                let fullItem = itemInfos.items.find(i => i.itemKey === item);
                let playerItems = player.items.filter(i => i.amount > 0);
                let playerItem = playerItems.find(i => i.id === fullItem.id);
                if (!playerItem) {
                    embed.setDescription("You do not own this item.");
                    return await interaction.reply({
                        embeds: [embed]
                    });
                };
                if (quantityParsed > playerItem.amount) {
                    embed.setDescription("You do not have enough quantity of this item to sell.");
                    return await interaction.reply({
                        embeds: [embed]
                    });
                };
                let fullAmount = (quantity*fullItem.value)/10;
                await interaction.client.database.removeItem(interaction.user.id,fullItem.id,quantityParsed);
                await interaction.client.database.addCoins(interaction.user.id,fullAmount,false);
                embed.setTitle(`${interaction.user.username}'s Sale Receipt`)
                embed.setFooter({text: `Thank you for your meme business`})
                embed.setDescription(`${interaction.user.toString()} sold ${quantityParsed.toLocaleString()}x ${interaction.client.methods.getEmojiString(fullItem.itemKey,interaction.client.itemEmojis)}}${fullItem.name} and got paid ${interaction.client.symbols.money} **${fullAmount.toLocaleString()}**`);
                return await interaction.reply({
                    embeds: [embed]
                });

            };
        };
    },
    autocomplete: async function(interaction) {
		const focusedValue = interaction.options.getFocused();
        if (focusedValue.length <= 0) {
            return await interaction.respond(
                sellableItems.slice(0,24).map(choice => ({ name: choice.name, value: choice.value })),
            );
        };
		let filtered = sellableItems.filter(choice => choice.name.toLowerCase().includes(focusedValue.toLowerCase()) || choice.value.toLowerCase().includes(focusedValue.toLowerCase()));
        if (filtered.length > 25) {
            filtered = filtered.slice(0,24);
        }
		await interaction.respond(
			filtered.map(choice => ({ name: choice.name, value: choice.value })),
		);
	},
};

async function getItemsToSell(excluded, playerItems) {
    let toSell = [];
    for(let i = 0; i < playerItems.length; i++) {
        let item = playerItems[i];
        let itemFull = itemInfos.items.find(i => i.id === item.id);
        if (!excluded.includes(itemFull.itemKey) && itemFull.type !== "Collectable") {
            toSell.push(Object.assign(playerItems[i], {name:itemFull.name,price:itemFull.value/10,type:itemFull.type,itemKey:itemFull.itemKey}));
        };
    };
    return toSell;
}

async function getShopEmbed(embed, items, page, maxPage, client, playerItems) {
    let str = "";
    if (items.length) {
        items = items.find(p => p.page === page).items;
    } else {
        str += "No items found!"
    };
    if (maxPage === 0) maxPage = 1;
    items.map(i => {
        let item = itemInfos.items.find(it => it.id === i.id);
        let playerAmountOfItem = playerItems.find(it => it.id === i.id);
        str += `${client.methods.getEmojiString(item.itemKey,client.itemEmojis)} **${item.name}** (${playerAmountOfItem ? playerAmountOfItem.amount : 0}) **-** [${client.symbols.money} ${item.value.toLocaleString()}](https://www.youtube.com/watch?v=ETxmCCsMoD0)${i.stock ? ` — \`${i.stock.toLocaleString()}/${i.stockMax.toLocaleString()}\`` : ""}\n${item.description}\n\n`
    });
    embed.setDescription(str);
    embed.setFooter({text: `Stocks resets hourly | /item <item> for more item info ─ Page ${page} of ${maxPage}`});
    return embed;
};