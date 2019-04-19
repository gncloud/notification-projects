const logger = require('./Logger')
const TelegramHandler = require('./handlers/TelegramHandler')
const NotificationScheduler = require('./NotificationScheduler')
const Collectors = require('./collectors')
const jsonfile = require('jsonfile')

const sourcePath = __dirname.substring(0, __dirname.indexOf('src') - 1)
const config = jsonfile.readFileSync(sourcePath + '/config.json')

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

(async () => {
    logger.info('봇 시작')
    new NotificationServer().listen()    
})()
logger.info('노드매니저 시작')
const homePath = __dirname.substring(0, __dirname.indexOf('naver-cafe-notification') - 1)
let restartShellPath = homePath + '/naver-cafe-notification/restart.sh'
let configPath = homePath + '/naver-cafe-notification/config.json'
logger.info('재시작 스크립트: ' + restartShellPath)
logger.info('재시작 스크립트: ' + configPath)
const NodeManager = require('node-manager')
new NodeManager(restartShellPath, configPath).listen()

