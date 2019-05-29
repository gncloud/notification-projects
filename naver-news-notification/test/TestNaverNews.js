const request = require('request-promise-native')
console.log(new Date().getTime())
request({
        uri: 'https://openapi.naver.com/v1/search/news.json',
        method: 'get',
        headers: {
            'X-Naver-Client-Id': '4B2faCC7kBDgZkMHxCvq',
            'X-Naver-Client-Secret': '9EHBG1m6XV',
            'Cache-Control':'private, no-cache, no-store, must-revalidate, max-age=0',
            'Pragma':'no-cache',
            'Expires':'0'
        },
        qs: {
            query: '비트코인',
            display: 11,
            sort: 'date',
            hh: new Date().getTime()
        }
    }
)
.then(res => {
    console.log(res)
    const items = res.items
    // items.forEach(item => {
    //     try {
    //         item.title
    //         item.originallink
    //         item.link
    //         item.description
    //         item.pubDate

    //     } catch(err) {

    //     }
    // })

})
