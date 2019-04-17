const MessageQueue = require('./MessageQueue')
const logger = require('./Logger')

module.exports = class NotificationScheduler {
    constructor(handlers) {
        this.handlers = handlers
        this.task()
    }

    task() {
        try {
            for (let i = 0; i < 50; i++) {
                let message = MessageQueue.poll()
                if (message === null) {
                    break
                }
                this.handlers[message.messenger].sendMessage(message.message, message.option)
            }
        } catch (e) {
            logger.debug('에러' + e)
        } finally {
            setTimeout(() => { this.task() }, 1000)
        }
    }
}