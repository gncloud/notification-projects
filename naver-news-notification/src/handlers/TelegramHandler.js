process.env.NTBA_FIX_319 = 1
const logger = require('../Logger')
const TelegramBot = require('node-telegram-bot-api')
const CacheMananger = require('../CacheManager')
const MessageHandler = require("./MessageHandler")

module.exports = class TelegramHandler {
    constructor(config) {
        this.config = config
        this.cacheId = 'telegram'
        this.cache = CacheMananger.getCache(this.cacheId)
        if (!this.cache.chatIds) {
            this.cache.chatIds = {}
        }
        this.removeCount = {}
        this.messageHandler = new MessageHandler(this)
        this.bot = new TelegramBot(config.token, { polling: true })
        this.bot.on('message', (message) => {this.messageSubscribe(message)})
    }
    sendMessage(message, option) {
        if (option !== undefined && option.chatId !== undefined) {
            this.bot.sendMessage(option.chatId, message, {
                disable_web_page_preview: true
            })
                .then(m => {
                    delete this.removeCount[chatId]
                })
                .catch(e => {
                    if (e) {
                        logger.debug('텔레그램 전송 실패 chatId:' + chatId + ', 내용:' + e.body)
                        this.checkRemoveChatId(chatId)
                    }
                })
        } else {
            let chatIds = this.cache.chatIds
            Object.keys(chatIds).forEach(chatId => {
                this.bot.sendMessage(chatId, message, {
                    disable_web_page_preview: true
                })
                    .then(m => {
                        delete this.removeCount[chatId]
                    })
                    .catch(e => {
                        if (e) {
                            logger.debug('텔레그램 전송 실패 chatId:' + chatId + ', 내용: '+ e.body)
                            this.checkRemoveChatId(chatId)
                        }
                    })
            })
        }
    }
    addChatId(chatId) {
        this.cache.chatIds[chatId] = {}
        CacheMananger.setCache(this.cacheId, this.cache)
        logger.debug('텔레그램 사용자 추가 >> ' + chatId)
    }
    removeChatId(chatId) {
        delete this.cache.chatIds[chatId]
        CacheMananger.setCache(this.cacheId, this.cache)
        logger.debug('텔레그램 사용자 제거 >> ' + chatId)
    }
    getChatId(chatId) {
        return this.cache.chatIds[chatId]
    }
    checkRemoveChatId(chatId) {
        if (this.removeCount[chatId] === undefined) {
            this.removeCount[chatId] = 5
        }
        this.removeCount[chatId] -= 1
        if (this.removeCount[chatId] <= 0) {
            delete this.cache.chatIds[chatId]
            delete this.removeCount[chatId]
            CacheMananger.setCache(this.cacheId, this.cache)
            logger.debug('채팅 아이디 제거 >>' +  chatId)
        }
    }
    messageSubscribe(message) {
        try {
            let action = message.text.substring(0, message.text.indexOf(" ") == -1 ? message.text.length : message.text.indexOf(" "))
            let params = null
            if (action.startsWith('/')) {
                action = action.substring(1)
                params = message.text.substring(message.text.indexOf(" ") == -1 ? message.text.length : message.text.indexOf(" "))
            }
            this.messageHandler[action](message, params)
        } catch(e) {
            logger.error("알수없는 액션", e)
        }
    }
}