// automations/core/Logger.js
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class Logger {
    constructor(component) {
        this.component = component;
        this.logDir = path.join(__dirname, '../../logs');
        if (!fs.existsSync(this.logDir)) fs.mkdirSync(this.logDir, { recursive: true });
        this.logFile = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);
    }

    info(msg) { this._log('INFO', msg, chalk.blue); }
    success(msg) { this._log('SUCCESS', msg, chalk.green); }
    warn(msg) { this._log('WARN', msg, chalk.yellow); }
    error(msg) { this._log('ERROR', msg, chalk.red); }

    _log(level, msg, colorFn) {
        const timestamp = new Date().toISOString();
        const formattedMsg = `[${timestamp}] [${this.component}] [${level}] ${msg}`;
        
        // Console output
        console.log(colorFn(formattedMsg));
        
        // File output
        fs.appendFileSync(this.logFile, formattedMsg + '\n');
    }
}

module.exports = Logger;
