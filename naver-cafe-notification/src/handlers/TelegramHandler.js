process.env.NTBA_FIX_319 = 1
const logger = require('../Logger')
const TelegramBot = require('node-telegram-bot-api')
const CacheMananger = require('../CacheManager')

module.exports = class TelegramHandler {
    constructor(config) {
        this.config = config
        this.cacheId = 'telegram'
        this.cache = CacheMananger.getCache(this.cacheId)
        if (config.chatId) {
            this.cache.chatIds = {
                [config.chatId]: []
            }
            CacheMananger.setCache(this.cacheId, this.cache)
        }
        this.bot = new TelegramBot(config.token, { polling: true })
        this.bot.on('message', (message) => {this.messageHandle(message, this)})
    }
    sendMessage(message, option) {
        let chatIds = this.cache.chatIds
        Object.keys(chatIds).forEach(chatId => {
            this._sendMessage(chatId, message)
        })
    }
    _sendMessage(chatId, message) {
        this.bot.sendMessage(chatId, message)
        .catch(e => {
            if (e) {
                logger.debug('텔레그램 전송 실패 chatId:' + chatId + ', 내용: '+ e.body)
            }
        })
    }
    messageHandle(message, el) {
        logger.debug('전달 받은 메시지: ' + message)
        logger.debug('아무것도 하지 않음.')
    }
}