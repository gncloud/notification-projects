const logger = require('../Logger')
const request = require('request-promise-native')
const MessageQueue = require('../MessageQueue')
const CacheMananger = require('../CacheManager')

module.exports = class NaverNewsCollector {
    constructor(config) {
        this.seq = 0
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
        logger.debug('수집 시작. 검색할 키워드 수 ' + keywords.length + "\n" + keywords)
        try {
            let lastItemkeys = this.cache.lastItemKey
            if(this.seq > 10) {
                this.seq = 0
            } else {
                this.seq++;
            }
            // console.log(">>>" + this.config.display + this.seq)
            keywords.forEach(async keyword => {
                let messages = new Set()
                let payload = {
                    uri: this.config.url,
                    method: 'GET',
                    headers: {
                        'X-Naver-Client-Id': this.config.clientId,
                        'X-Naver-Client-Secret': this.config.clientSecret,
                    },
                    qs: {
                        query: keyword,
                        display: this.config.display + this.seq, //캐시를 피하기 위해 파라미터를 변경한다.
                        sort: 'date',
                    }
                }
                let res = JSON.parse(await request(payload))
                // console.log("-----------------------------------------")
                // console.log(res.items)
                console.log("=====================================================================")
                // console.log(payload)
                const items = res.items.reverse()
                let found = false
                logger.info("------ ["+keyword + "] 검색시작. 마지막 뉴스: " + new Date(lastItemkeys[keyword]) + "------")

                if(items.length > 0) {
                    let item = items[items.length-1]
                    logger.debug(">>LAST [" + keyword + "] " + item.pubDate + " > " + item.title)
                }
                items.forEach(item => {
                    let pd = new Date(item.pubDate)
                    let key = pd.getTime()
                    let timeText = pd.getHours()+":"+pd.getMinutes()
                    if (lastItemkeys[keyword] === undefined) {
                        // 최초 키워드 등록시 대량 메시지 전송을 막기위해 최신등록.
                        lastItemkeys[keyword] = key
                    }
                    
                    //동일한 시각으로 여러 뉴스가 한번에 들어오는 경우 found 가 없다면 딱 하나만 전송되고 나머지는 사라지게 되므로,
                    //한번 신규 뉴스가 발견되면 그 이후는 더욱 최신시간이 되므로, found 변수를 도입하여 해결한다.
                    if (key > lastItemkeys[keyword] || found) {
                        lastItemkeys[keyword] = key
                        let message = item.title + ' [네이버 ' + timeText + ']\n' + item.originallink
                        messages.add(message)
                        found = true
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
                    //this.cache.lastItemKey = lastItemkeys
                    CacheMananger.setCache(this.cacheId, this.cache)
                }
                //swsong: forEach문을 async로 루프돌기때문에 아래 지연이 의미없음. 동시실행됨.
                // 다음 키워드 조회시 1초 지연.
                // let start = new Date().getTime()
                // while (new Date().getTime() < start + 1000);
            })
        } catch(err) {
            logger.error('naver news request failed', err)
        } finally {
            setTimeout(() => { this.run() }, 1 * 60 * 1000)
        }
    }
}
