const fs = require('fs')

const logDir = 'logs';

const level = 'debug'

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir)
}

let winston = require('winston')
let expressWinston = require('express-winston')
winston.transports.DailyRotateFile = require('winston-daily-rotate-file')

const logger = {
    getLogger() {
        return winston.createLogger({
            transports: [
                new (winston.transports.DailyRotateFile)({
                    filename: logDir + '/application-%DATE%.log',
                    datePattern: 'YYYY-MM-DD-HH',
                    zippedArchive: true,
                    maxSize: '20m',
                    maxFiles: '14d',
                    level: level,
                    format: winston.format.combine(
                        winston.format.timestamp({
                            format: 'YYYY-MM-DD HH:mm:ss'
                        }),
                        winston.format.json()
                    )
                }),
                new (winston.transports.Console)({
                    format: winston.format.combine(
                        winston.format.timestamp({
                            format: 'YYYY-MM-DD HH:mm:ss'
                        }),
                        winston.format.json()
                    ),
                    level: level
                })
            ]
        })
    }
}



module.exports = logger