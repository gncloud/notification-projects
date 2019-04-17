const fs = require('fs')
const convert = require('xml-js');
const logger = require('./Logger').getLogger('utils');

module.exports = {
    _lastDate: new Date(),

    createFile(path) {
        if (!fs.existsSync(path)) {
            fs.closeSync(fs.openSync(path, 'w'))
            logger.debug('[createFile] chatFilters.json 파일 생성.')
        }
    },
    saveChatFilters(path, chatFilters) {
        try {
            this.createFile(path)
            fs.writeFileSync(path, JSON.stringify(chatFilters))
            logger.debug('[saveChatFilters] 필터 저장완료.' + chatFilters)
        } catch (error) {
            logger.error(error)
        }
    },
    loadChatFilters(path) {
        let chatFilters = {}
        try {
            this.createFile(path)
            let fileChatFilters = fs.readFileSync(path)
            logger.debug('[loadChatFilters] 필터 정보.' + fileChatFilters)
            if (fileChatFilters.toString() !== '') {
                chatFilters = JSON.parse(fileChatFilters.toString())
            }
        } catch (error) {
            console.log(error)
            logger.error('[loadChatFilters] > output.log' + error)
        }
        return chatFilters
    },
    chatNotificationFilter(items) {
        let sendItems = []
        if (items === undefined || items.length === 0) {
            logger.debug("[chatNotificationFilter] 공시 정보가 없습니다.")
            return sendItems
        }

        items.forEach(item => {
            let itemPubDate = new Date(item['pubDate']['_text'])
            if (this._lastDate.getTime() < itemPubDate.getTime()) {
                // 필터 조건 추가.
                let category = item['category']['_text']
                let checkUseCategory = category === '유가' || category === '코스닥'
                logger.debug(`[chatNotificationFilter] 카테고리: ${item['category']['_text']}, 사용여부: ${checkUseCategory}`)
                if (checkUseCategory === false) {
                    // 다음꺼 확인.
                    return true
                }

                let pubDate = item['pubDate']['_text']
                if (this._lastDate.getTime() < new Date(pubDate).getTime()) {
                    this._lastDate = new Date(pubDate)
                }
                sendItems.push(item)
            } else {
                // 지난 날짜는 탈출.
                return false
            }
        })
        logger.debug('[chatNotificationFilter] 전송할 메시지 갯수:' + sendItems.length)
        return sendItems
    },
    parseXmlToJson(xml) {
        return JSON.parse(convert.xml2json(xml, { compact: true }));
    }
}