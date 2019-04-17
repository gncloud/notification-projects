/** 
 * 수집기 등록.
 */

const NaverCafeCollector = require('./NaverCafeCollector')

module.exports = class Collector {
    constructor(config) {
        new NaverCafeCollector(config.naverCafe || {})
    }
}
