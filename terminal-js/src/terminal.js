const moment = require('moment');
const chalk = require('chalk');
const default_config = require('./data/default_config.json');
const { beautifyIntegers } = require('./util/methods');

class Terminal {
    constructor(config) {
        if (!config) {
            this.config = default_config;
        } else {
            this.config = config;
        };
    }

    bracket1() {
        return chalk.hex(this.config.bracket_color)("[")
    };

    bracket2() {
        return chalk.hex(this.config.bracket_color)("]")
    };

    getTime(type) {
        if(!type) {
            return chalk.hex(this.config.time_color)(new Date().toLocaleTimeString())
        } else {
            return (`${chalk.hex(this.config.time_color)(new Date().toLocaleTimeString())} ${this.bracket1()}${chalk.hex(this.config[type])(this.config.symbols[type])}${this.bracket2()}`)
        }
    };

    success(text) {
        const timeStr = this.getTime("success");
        if (this.config.beautifyIntegers) {
            text = beautifyIntegers(text);
        };
        console.log(`${timeStr} ${chalk.hex(this.config.success)(text)}`);
    };

    error(text) {
        const timeStr = this.getTime("error");
        if (this.config.beautifyIntegers) {
            text = beautifyIntegers(text);
        };
        console.log(`${timeStr} ${chalk.hex(this.config.error)(text)}`);
    };

    warning(text) {
        const timeStr = this.getTime("warning");
        if (this.config.beautifyIntegers) {
            text = beautifyIntegers(text);
        };
        console.log(`${timeStr} ${chalk.hex(this.config.warning)(text)}`);
    };

    debug(text) {
        const timeStr = this.getTime("debug");
        if (this.config.beautifyIntegers) {
            text = beautifyIntegers(text);
        };
        console.log(`${timeStr} ${chalk.hex(this.config.debug)(text)}`);
    };
};

module.exports = Terminal;