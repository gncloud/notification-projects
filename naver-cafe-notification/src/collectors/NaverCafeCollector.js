const logger = require('../Logger')
const request = require('request-promise-native')
const MessageQueue = require('../MessageQueue')
const CacheMananger = require('../CacheManager')
let webdriver = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const key = require('selenium-webdriver/lib/input')
var URLSearchParams = require('url-search-params')
const jsonfile = require('jsonfile')

const homePath = __dirname.substring(0, __dirname.indexOf('src') - 1)
const config = jsonfile.readFileSync(homePath + '/config.json')

const screen = {
    width: 800,
    height: 600
}

module.exports = class NaverCafeCollector {
    constructor() {
        this.cacheId = 'naverCafe'
        this.loginFailCount = 0
        this.init()
        this.run()
    }
    buildDriver() {
        //고려사항: 추후에는 this.driver.quit()를 사용해서 쓰고 바로 버리는 방식도 좋을듯... try..catch..활용..
        let o = new chrome.Options();
        o.addArguments('headless');
        o.addArguments('no-sandbox');
        o.addArguments('disable-dev-shm-usage');
        this.driver = new webdriver.Builder()
            .forBrowser('chrome')
            // .setChromeOptions(o)  //1. 리눅스 서버의 경우 이 옵션을 사용한다.
            // .setChromeOptions(new chrome.Options().headless().windowSize(screen))
            .setChromeOptions(new chrome.Options().windowSize(screen)) //2. macbook 개발환경에서는 이 옵션을 사용한다.
            .build()
    }
    init() {
        this.cache = CacheMananger.getCache(this.cacheId)
        logger.debug('네이버카페 게시판 수집')
        this.by = webdriver.By
        this.until = webdriver.until
        this.buildDriver();
    }
    format(article) {
        return `제목: ${article.titleText}\n`
             + `작성자: ${article.nickName}\n`
             + `링크: https://cafe.naver.com/ric01/${article.articleId}`
    }
    async run() {
        let targetList = []
        try {
            let isLogin = await this.isLoginCheck()
            if (this.loginFailCount > 10) {
                logger.error('로그인을 할수없습니다.')
                MessageQueue.offer('telegram', '로그인을 할수없습니다.')
            }
            if (!isLogin) {
                this.loginFailCount += 0
                await this.naverLogin()
                if(!await this.isLoginCheck()) {
                    return
                }
            }
            this.loginFailCount = 0
            // 로그인 확인 후.
            await this.driver.get('https://cafe.naver.com/ArticleList.nhn?search.clubid=20430423&search.boardtype=L&search.menuid=&search.questionTab=A&search.marketBoardTab=D&search.specialmenutype=&userDisplay=50')
            await this.driver.wait(this.until.elementLocated(this.by.css('title'), 1000))
            await this.driver.switchTo().frame('cafe_main')
            logger.debug('카페 메인진입')
            /* 2019.7.31 갑자기 글 수집이 안되서 봤더니 div 사이에 <script>가 두개 추가됨. 즉, 네이버 화면에서 소스코드가 살짝 바뀌면 대응이 안되는 한계가 있음..*/
            let articleList = await this.driver.findElements(this.by.css('#main-area > div:nth-child(6) > table > tbody > tr'))
            logger.debug('아티클 체크 ' + articleList.length + " 개..")
            for (let i=0; i < articleList.length; i++) {
                let article = await articleList[i].findElement(this.by.className('td_article'))

                let menuTag = await article.findElement(this.by.css('.link_name'))
                let menuText = await menuTag.getText()
                let menuUrl = await menuTag.getAttribute('href')
                let menuId = this.getPram(menuUrl, 'search.menuid')
                
                let titleTag = await article.findElement(this.by.css('.article'))
                let titleText = await titleTag.getText()
                let titleUrl = await titleTag.getAttribute('href')
                let articleId = this.getPram(titleUrl, 'articleid')

                let nickTag = await articleList[i].findElement(this.by.css('.td_name .m-tcol-c'))
                let nickName = await nickTag.getText()

                if (!config.collectors.naver.cafe.ric01.menuIds.includes(Number(menuId))) {
                    continue
                }
                if (this.cache.lastItemKey === articleId) {
                    break
                }
                
                logger.debug('메뉴아이디: ' + menuId +', 작성자:' + nickName + ', 제목: ' + titleText + ', 아이디: ' + articleId + ', 링크: ' + titleUrl)

                targetList.push({
                    menuId: menuId,
                    menuText: menuText,
                    titleText: titleText,
                    titleUrl: titleUrl,
                    articleId: articleId,
                    nickName: nickName
                })
            }
            logger.debug('전송할 아티클 ' + targetList.length + " 개..")
            targetList = targetList.reverse()
            for (let i=0; i < targetList.length; i++) {
                this.cache.lastItemKey = targetList[i].articleId
                // await this.driver.executeScript(`location.href="${targetList[i].titleUrl}"`)
                // await this.driver.wait(this.until.elementLocated(this.by.css('title'), 1000))
                // let contents = ''
                // try {
                //     let bodyTag = await this.driver.findElement(this.by.css('#tbody'))
                //     contents = await bodyTag.getText()
                //     contents = contents.replace(/\n\n/g, '\n')
                // } catch (err) {
                //     logger.error(err)
                //     contents = '조회 권한이 없습니다.'
                // }
                let message = this.format(targetList[i])
                MessageQueue.offer('telegram', message)
            }
            logger.debug('완료!')
            CacheMananger.setCache(this.cacheId, this.cache)
            
        } catch(e) {
            logger.error(e)
            await this.driver.quit();
            this.buildDriver();
        } finally {
            // await driver.quit()
            setTimeout(() => { this.run() }, 30000)
        }
    }
    async isLoginCheck() {
        let isLogin = false
        let err1 = null
        let curUrl = await this.driver.getCurrentUrl()
        if (curUrl === 'data:,') {
            return false
        }
        if (curUrl.indexOf('cafe.naver.com') != -1) {
            try {
                // 카페페이지에서 로그인 여부 확인.
                await this.driver.switchTo().defaultContent()
                await this.driver.findElement(this.by.css('#mynews_activity_count_display'))
                isLogin = true
            } catch(err) {
                err1 = err
                isLogin = false
            }
        }
        if (isLogin === false && curUrl.indexOf('www.naver.com') != -1) {
            try {
                // 네이버 메인에서 로그인 확인.
                await this.driver.switchTo().frame('minime')
                await this.driver.findElement(this.by.css('#user_name'))
                isLogin = true
            } catch(err) {
                if (err1 !== null) {
                    logger.error(err1)
                }
                logger.error(err)
                isLogin = false
            }
        }
        // logger.debug('로그인 상태:' + isLogin)
        return isLogin
    }
    async naverLogin() {
        logger.debug('로그인 시도')
        let id = config.collectors.naver.login.id
        let pw = config.collectors.naver.login.pw
        try {
            let curUrl = await this.driver.getCurrentUrl()
            let loginUrl = 'https://nid.naver.com/nidlogin.login?mode=form&url=https%3A%2F%2Fwww.naver.com'
            if (curUrl !== loginUrl) {
                await this.driver.get(loginUrl)
                await this.driver.wait(this.until.elementLocated(this.by.css('title'), 1000))
            }
            await this.driver.executeScript(`document.getElementById('id').value="${id}"`)
            await this.driver.executeScript(`document.getElementById('pw').value="${pw}"`)
            await (await this.driver.findElement(this.by.id('pw'))).sendKeys(key.Key.ENTER)
            logger.debug('로그인 성공')
        } catch(err) {
            logger.error(err)
            logger.debug('로그인 실패')
        }
    }
    getPram(url, key) {
        return new URLSearchParams(url).get(key)
    }
}
