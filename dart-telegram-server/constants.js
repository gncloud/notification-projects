module.exports = {
    usage: `[usage]
    1. 명령어: /admin [password]
        - 로그인을 진행합니다.

    2. 명령어: /setfilter [keyword]
        - 등록된 필터에 부합하는 공시 정보를 메시지 받을수있습니다.
        - 여러개의 필터를 등록할수있습니다. 구분자는 ,(콤마)로 구분합니다.
        - ex) /setfilter 상황보고서, 유가

    3. 명령어: /getfilter
        - 등록되어 있는 필터단어를 조회합니다.
    
    4. 도움말: /help
        - usage 내용이 출력됩니다.
    `
}