const logger = require('../Logger')
const CONFIG = require('../../config')
const CacheMananger = require('../CacheManager')

module.exports = class MessageHandler {
    constructor(telegramHandler) {
        this.telegramHandler = telegramHandler
    }

    start(message, params) {
        let msg = '환영합니다. \n' + '정보를 받으려면 로그인을 하세요. \nid: ' + message.chat.id
        this.telegramHandler.bot.sendMessage(message.chat.id, msg)
    }
    login(message, params) {
        let newChatId = message.chat.id
        if (params.trim() != CONFIG.login) {
            this.telegramHandler.bot.sendMessage(newChatId, '비밀번호가 틀렸습니다.')
            return false
        }
        
        this.telegramHandler.addChatId(newChatId)
        this.telegramHandler.bot.sendMessage(newChatId, '로그인하였습니다.')
    }
    logout(message, params) {
        let chatId = message.chat.id
        if (!this._isAuthentication(message)) {
            return false
        }
        this.telegramHandler.removeChatId(chatId)
        this.telegramHandler.bot.sendMessage(chatId, '로그아웃하였습니다.')
    }
    _isAuthentication(message) {
        let chatId = message.chat.id
        if(this.telegramHandler.getChatId(chatId) === undefined) {
            this.telegramHandler.bot.sendMessage(chatId, '권한이 없습니다.')
            return false
        }
        return true
    }
    add(message, params) {
        if (!this._isAuthentication(message)) {
            return false
        }
        if (params === undefined || params === '') {
            this.telegramHandler.bot.sendMessage(message.chat.id, '알수없는 키워드입니다.')
            return false
        }
        let cache = CacheMananger.getCache('naverNews')
        params.split(',').forEach(keyword => {
            if ('' === keyword) {
                return true
            }
            cache.keywords.push(keyword.trim())
        })
        logger.debug('변경된 키워드 >> ', cache.keywords)
        CacheMananger.setCache('naverNews', cache)
        this.telegramHandler.bot.sendMessage(message.chat.id, '검색 키워드 추가되었습니다.')
    }
    del(message, params) {
        if (!this._isAuthentication(message)) {
            return false
        }
        let cache = CacheMananger.getCache('naverNews')
        cache.keywords.forEach((keyword, index) => {
            if (params.trim() == keyword) {
                cache.keywords.splice(index, 1)
                delete cache.lastItemKey[keyword]
                return false
            }
        })
        logger.debug('변경된 키워드 >> ', cache.keywords)
        CacheMananger.setCache('naverNews', cache)
        this.telegramHandler.bot.sendMessage(message.chat.id, '검색 키워드 삭제되었습니다.')
    }
    get(message, params) {
        if (!this._isAuthentication(message)) {
            return false
        }
        let cache = CacheMananger.getCache('naverNews')
        this.telegramHandler.bot.sendMessage(message.chat.id, `등록된 갯수: ${cache.keywords.length} \n키워드: ${cache.keywords}`)
    }
    help(message, params) {
        let text = `
사용방법.
1. 로그인하기
     로그인을해야지 알림을 받을수 있습니다.
     예제)
     /login 비밀번호입력하세요.
2. 키워드 등록
     add 명령어와 한칸띄어쓰기 후 검색 키워드입력
     여러건의 등록은 콤바로 구분합니다.
   예제) 
     /add 펭귄
     또는
     /add 펭귄, 퀴즈
3. 키워드 삭제
     del 명령어와 한칸띄어쓰기 후 검색 키워드입력
   예제)
     /del 펭귄
4. 등록된 키워드 조회
     현재 등록된 키워드를 확인할려면 get 명령어를 사용
   예제)
     /get
`
        this.telegramHandler.bot.sendMessage(message.chat.id, text)
    }
}

