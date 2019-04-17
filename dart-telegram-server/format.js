module.exports = {
    formatItem(item) {
        return item['title']['_text'] + '\n' + item['link']['_text']
    }
}