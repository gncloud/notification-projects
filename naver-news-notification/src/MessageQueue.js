class NotificationQueue {
    constructor() {
        this.memory = []
    }
    offer(messenger, message, option={}) {
        // 요소 추가
        this.memory.push({
            messenger: messenger,
            message: message,
            option: option
        })
    }
    poll() {
        // 요소 반환
        return this.memory.splice(0, 1)[0] || null
    }
    peek() {
        // 요소 참조
        return this.memory[0] || null
    }
}


module.exports = new NotificationQueue()