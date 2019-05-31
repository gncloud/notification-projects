# 토찾사 네이버 카폐 새로운글 메시지 전송

## 실행방법.
1. $ npm install
2. config.json 파일의 텔레그램 봇토큰, 네이버 계정, 채팅아이디를 입력
3. npm start
4. 텔레그램으로 메시지가 받으면 성공.

# 텔레그램 정보

- 채널이름: 개박사 TODAY
- 채널 token : -1001234845514

- 토찾사봇 이름: @ttcsdog_bot
- 토찾사봇 토큰: 890057644:AAEsjzWHIppId5rvZTNJNTyiOLRw7QzCI40 

현재 토찾사봇은 개박사TODAY 채널에 관리자로 승격되어 메시지를 전송하고 있다.

#개박사 카페24 접속정보

- IP: 183.111.125.170
- 아이디: ubuntu
- 패스워드: ttcsdog

---
- 아이디 : root
- 패스워드 : gowjrdhkd0!

# 이슈
맥북에서의 chrome driver option과 ubuntu server 에서의 옵션이 달라야함.
 - NaverCafeCollector.js 참고.

**Ubuntu Server 사용시**
```
let o = new chrome.Options();
    o.addArguments('headless');
    o.addArguments('no-sandbox');
    o.addArguments('disable-dev-shm-usage');
```