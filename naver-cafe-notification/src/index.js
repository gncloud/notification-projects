const logger = require('./Logger')
const TelegramHandler = require('./handlers/TelegramHandler')
const NotificationScheduler = require('./NotificationScheduler')
const Collectors = require('./collectors')
const jsonfile = require('jsonfile')

const homePath = __dirname.substring(0, __dirname.indexOf('src') - 1)
const config = jsonfile.readFileSync(homePath + '/config.json')

class NotificationServer {
    constructor() {
        
    }
    listen() {
        let handlers = {}
        if (config.messengers === undefined || Object.keys(config.messengers).length == 0) {
            logger.error('메신저를 먼저 등록하세요.')
            throw Error('메신저를 먼저 등록하세요.')
        }
        Object.keys(config.messengers).forEach(id => {
            handlers[id] = new TelegramHandler(config.messengers[id])
        })
        this.scheduler = new NotificationScheduler(handlers)
        this.collect()
    }
    async collect() {
        new Collectors(config.collectors)
    }
}


logger.info('봇 시작')
new NotificationServer().listen()

// const NodeManager = require('node-manager')
// new NodeManager().listen()
