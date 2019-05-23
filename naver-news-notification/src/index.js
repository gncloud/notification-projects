const logger = require('./Logger')
const TelegramHandler = require('./handlers/TelegramHandler')
const NotificationScheduler = require('./NotificationScheduler')

const NaverNewsCollector = require('./collectors/NaverNewsCollector')

const CONFIG = require('../config')

class NotificationServer {
    constructor(config) {
        this.listen(config.messenger || {})
        this.collect(config.collector || {})
    }
    listen(config) {
        let handlers = {}
        if (config.telegram) {
            handlers['telegram'] = new TelegramHandler(config.telegram)
        }
        this.scheduler = new NotificationScheduler(handlers)
    }
    async collect(config) {
        new NaverNewsCollector(config.naverNews)
    }
}

logger.info('봇 시작')
new NotificationServer({
    messenger: {
        telegram: CONFIG.telegram
    },
    // 혹시 시작할때 설정이 있을수있으므로..
    collector: {
        naverNews: CONFIG.collectors.naverNews
    }
})
