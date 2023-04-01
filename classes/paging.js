const emojis = require('../data/emojis.json');
const { ComponentType } = require('discord.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const { EventEmitter } = require('events');

class Paging  {
    constructor(items, itemsPerPage) {
        this.items = items;
        this.itemsPerPage = itemsPerPage;
        this.paginatedItems = [];
        this.currentPage = 1;
        this.collector = null;
        this.components = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId("back")
            .setEmoji(emojis.back)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
            new ButtonBuilder()
            .setCustomId("backSmall")
            .setEmoji(emojis.backSmall)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
            new ButtonBuilder()
            .setCustomId("forwardSmall")
            .setEmoji(emojis.forwardSmall)
            .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
            .setCustomId("forward")
            .setEmoji(emojis.forward)
            .setStyle(ButtonStyle.Primary)
        );
    };

    async paginate() {
        let items = this.items;
        let paginatedItems = [];
        let pages = Math.ceil(items.length/this.itemsPerPage);
        let offset = 0;
        let page = 1;
        for(let i = 0; i < pages; i++) {
            let arr = items.slice(offset, offset+this.itemsPerPage);
            paginatedItems.push({
                page: page,
                items: arr
            });
            if (offset+this.itemsPerPage >= items.length) {
                offset = items.length;
            } else {
                offset += this.itemsPerPage;
            };
            page++;
        };
        this.maxPage = paginatedItems.length;
        this.currentPage = 1;
        this.paginatedItems = paginatedItems;
        return paginatedItems;
    };

    async disableComponents(component) {
        if (component) {
            this.components.components.find(c => c.data.custom_id === component).setDisabled(true);
        } else {
            for(let i = 0; i < this.components.components.length; i++) {
                this.components.components[i].setDisabled(true);
            };
        }
        return true;
    };

    async enableComponents(component) {
        if (component) {
            this.components.components.find(c => c.data.custom_id === component).setDisabled(false);
        } else {
            for(let i = 0; i < this.components.components.length; i++) {
                this.components.components[i].setDisabled(false);
            };
        }
        return true;
    }
};

module.exports = Paging;