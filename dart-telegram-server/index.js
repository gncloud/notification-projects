process.env.NTBA_FIX_319 = 1;
const request = require('request-promise-native');
const TelegramBot = require('node-telegram-bot-api');
const format = require('./format')
const config = require('./config')
const utils = require('./utils')
const constants = require('./constants')
const logger = require('./Logger').getLogger('index');

class DartTelegramServer {
    constructor() {
        this.token = config.telegramToken
        this.rssUrl = config.rssUrl
        this.chatFilterPath = config.filePath
        this.adminPassword = config.adminPassword
    }
    run() {
        try {
            this.chatFilters = utils.loadChatFilters(this.chatFilterPath)
            this.botListener()
            this.rssReader()
            logger.debug('[run] 시작되었습니다.')
        } catch (e) {
            logger.debug(e)
            setTimeout(() => {
                logger.debug('[run] 재시작..')
                this.run()
            }, 30000)
        }
    }

    isLogin(chatId) {
        return this.chatFilters[chatId] !== undefined
    }

    async botListener() {
        if (this.bot !== undefined) {
            await this.bot.stopPolling()
        }

        this.bot = new TelegramBot(this.token, { polling: true });
        this.bot.on('message', msg => {
            try {
                let chatId = msg.chat.id
                let text = msg.text
                let cmd = text.split(' ')[0]
                logger.debug('입력한 내용: ' + cmd)
                let option = ''
                try {
                    option = text.substring(cmd.length)
                } catch(error) {
                    // ignore
                }
                let filters = '';
                let isSaveChatFilters = false
                switch (cmd.toString().toLowerCase()) {
                    case '/start':
                        this.send(chatId, constants.usage)
                        break
                    case '/help':
                        this.send(chatId, constants.usage)
                        break
                    case '/admin':
                        if (this.adminPassword !== option.trim()) {
                            this.send(chatId, '비밀번호가 잘못되었습니다.')
                            return false
                        }
                        let name = `${msg.chat.first_name} ${msg.chat.last_name}`
                        // TODO 한명만 로그인. 기존 저장된 내용 삭제
                        try {
                            Object.keys(this.chatFilters).forEach(chatId => {
                                this.send(chatId, '로그아웃되었습니다.')
                                logger.debug('로그아웃' + chatId)
                            })
                        } catch (e) {
                            // ignore
                        }

                        this.chatFilters = {}

                        this.chatFilters[chatId] = []
                        this.send(chatId, '로그인하였습니다.\n' + name + ' 안녕하세요. \n필터를설정하면 알람을 받을수 있습니다.')
                        isSaveChatFilters = true
                        break
                    case '/setfilter':
                        if (!this.isLogin(chatId)) {
                            this.send(chatId, '로그인을 하세요.')
                            return false
                        }
                        filters = (option || '').split(',')
                            .map(f => f.trim())
                            .filter(f => f !== '')
                        this.chatFilters[chatId] = filters
                        if (filters.length == 0) {
                            this.send(chatId, "등록된 필터가 없습니다. \n전부 알림받습니다.")
                        } else {
                            this.send(chatId, `필터가 등록되었습니다. [${filters.join(',')}]`)
                        }
                        isSaveChatFilters = true
                        break
                    case '/getfilter':
                        if (!this.isLogin(chatId)) {
                            this.send(chatId, '로그인을 하세요.')
                            return false
                        }
                        filters = this.chatFilters[chatId] || ''
                        if (filters.length > 0) {
                            this.send(chatId, `등록된 필터: [${filters.join(',')}]`)
                        } else {
                            this.send(chatId, `등록된 필터가 없습니다.`)
                        }
                        break
                    default:
                        this.send(chatId, '잘못된 명령어입니다.')
                        this.send(chatId, constants.usage)
                }

                if (isSaveChatFilters) {
                    utils.saveChatFilters(this.chatFilterPath, this.chatFilters)
                }
            } catch (e) {
                logger.error('[botListener] >> output.log')
                console.log(e)
            }
        });
    }
    async send(chatId, message) {
        try {
            this.bot.sendMessage(chatId, message)
            logger.debug('[send] 상태:전송완료 채팅아이디:' + chatId  + ', 메시지:' + message)
        } catch (e) {
            logger.error('[send] 상태:전송실패 chatId:' + chatId)
        }
    }
    sendItems(items) {
        items.reverse().forEach(item => {
            // 채널대화는 봇이 채널에 관리자로 추가되어있는 상태에서 채널아이디로 메시지 전달
            // this.bot.sendMessage([채널아이디], format.formatItem(item))
            let isSend = false
            Object.keys(this.chatFilters)
            .forEach(chatId => {
                if (isSend) {
                    logger.debug('메시지당 1회 전송 제한합니다.')
                    return false
                }
                if (this.chatFilters[chatId].length == 0) {
                    // 등록된 필터가 없으면 전부 전송.
                    this.send(chatId, format.formatItem(item))
                    isSend = true
                    return false
                } else {
                    this.chatFilters[chatId].forEach(filter => {
                        let title = item['title']['_text']
                        if (title.indexOf(filter) != -1) {
                            this.send(chatId, format.formatItem(item))
                            isSend = true
                            return false
                        }
                    })
                }   
            });
        })
    }

    async rssReader() {
        try {
            if (this.chatFilters !== undefined && 
                this.chatFilters !== null &&
                this.chatFilters !== '' &&
                Object.keys(this.chatFilters).length > 0) {
                let response = await request(this.rssUrl)
                let rssJson = utils.parseXmlToJson(response)
                let items = rssJson['rss']['channel']['item']
                logger.debug(`[rssReader] item count: ${items.length}`)
                let sendItems = utils.chatNotificationFilter(items)
                this.sendItems(sendItems)
            }
        } catch (error) {
            logger.error('[rssReader] > output.log')
            console.log('[rssReader] ' + error)
        } finally {
            setTimeout(() => this.rssReader(), 15000)
        }
    }
}




new DartTelegramServer().run()
