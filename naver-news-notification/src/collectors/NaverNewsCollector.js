const logger = require('../Logger')
const request = require('request-promise-native')
const MessageQueue = require('../MessageQueue')
const CacheMananger = require('../CacheManager')

module.exports = class NaverNewsCollector {
    constructor(config) {
        this.config = config
        this.cacheId = 'naverNews'
        this.init()
        this.run()
    }
    init() {
        this.cache = CacheMananger.getCache(this.cacheId)
        if (this.cache.lastItemKey === undefined 
            || this.cache.lastItemKey === null) {
            this.cache.lastItemKey = {}
            CacheMananger.setCache(this.cacheId, this.cache)
        }
    }
    async run() {
        this.cache = CacheMananger.getCache(this.cacheId)
        let keywords = this.cache.keywords
        if (keywords === undefined || keywords === null) {
            keywords = []
            this.cache.keywords = keywords
            CacheMananger.setCache(this.cacheId, this.cache)
        }
        logger.debug('수집 시작. 검색할 키워드 수 ' + keywords.length)
        try {
            let lastItemkeys = this.cache.lastItemKey
            let messages = new Set()
            keywords.forEach(async keyword => {
                logger.info(keyword + ' 검색 시작.')
                let res = JSON.parse(await request({
                    uri: this.config.url,
                    method: 'GET',
                    headers: {
                        'X-Naver-Client-Id': this.config.clientId,
                        'X-Naver-Client-Secret': this.config.clientSecret
                    },
                    qs: {
                        query: keyword,
                        display: this.config.display,
                        // sort: 'date'
                    }
                }))
                const items = res.items.reverse()
                items.forEach(item => {
                    let key = new Date(item.pubDate).getTime()
                    if (lastItemkeys[keyword] === undefined) {
                        // 최초 키워드 등록시 대량 메시지 전송을 막기위해 최신등록.
                        lastItemkeys[keyword] = key
                    } else if (lastItemkeys[keyword] < key) {
                        lastItemkeys[keyword] = key
                        let message = item.title + '\n' + item.originallink
                        messages.add(message)
                    }
                })
                logger.debug("전송할 뉴스 갯수:" + messages.size)
                if (messages.size > 0) {
                    messages.forEach(message => {
                        message = message.replace(/(<([^>])+)>/gi, '')
                                         .replace(/(&lt;)/ig, '<')
                                         .replace(/(&gt;)+/gi, '>')
                                         .replace(/(&quot;)+/,'"')
                        logger.debug(message)
                        MessageQueue.offer('telegram', message)
                    })
                    this.cache.lastItemKey = lastItemkeys
                    CacheMananger.setCache(this.cacheId, this.cache)
                }
                // 다음 키워드 조회시 1초 지연.
                let start = new Date().getTime()
                while (new Date().getTime() < start + 1000);
            })
        } catch(err) {
            logger.error('naver news request failed', err)
        } finally {
            setTimeout(() => { this.run() }, 1 * 60 * 1000)
        }
    }
}
