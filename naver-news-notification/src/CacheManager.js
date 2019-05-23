const fs = require('fs')

class CacheManager {
    getCache(id) {
        let cacheFilePath = this.checkCacheFile(id)
        let buffer = fs.readFileSync(cacheFilePath)
        if (buffer.length === 0) {
            return {}
        } else {
            return JSON.parse(buffer)
        }
    }
    setCache(id, cache) {
        let cacheFilePath = this.checkCacheFile(id)
        fs.writeFileSync(cacheFilePath, JSON.stringify(cache))
    }
    checkCacheFile(id) {
        let cacheFilePath = this.getCacheFilePath(id)
        if (!fs.existsSync(cacheFilePath)) {
            fs.closeSync(fs.openSync(cacheFilePath, 'w'))
        }
        return cacheFilePath
    }
    getCacheFilePath(id) {
        return `src/cache/${id}.cache`
    }
}

module.exports = new CacheManager()