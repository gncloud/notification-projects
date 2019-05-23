const request = require('request-promise-native')

request({
        uri: 'https://openapi.naver.com/v1/search/news.json',
        method: 'get',
        headers: {
            'X-Naver-Client-Id': '4B2faCC7kBDgZkMHxCvq',
            'X-Naver-Client-Secret': '9EHBG1m6XV'
        },
        qs: {
            query: '비트코인',
            display: 60
        }
    }
)
.then(res => {
    console.log(res)
    const items = res.items
    items.forEach(item => {
        try {
            item.title
            item.originallink
            item.link
            item.description
            item.pubDate

        } catch(err) {

        }
    })
})
