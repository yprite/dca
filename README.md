# 암호화폐 DCA 투자 계산기

암호화폐 DCA(Dollar-Cost Averaging) 투자 전략의 결과를 계산하고 시각화하는 웹 애플리케이션입니다.

## 기능

- 다양한 암호화폐(비트코인, 이더리움, 바이낸스 코인 등) 지원
- 투자 주기 및 금액 설정
- 시작 날짜와 종료 날짜 설정
- 투자 결과 시각화 (자산 가치, 투자 금액, 코인 가격, 보유 코인 개수)
- 차트 확대/축소 및 이동 기능

## Docker Compose로 실행하기

이 애플리케이션은 Docker Compose를 사용하여 쉽게 실행할 수 있습니다.

### 사전 요구사항

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### 실행 방법

1. 저장소를 클론합니다:

```bash
git clone <repository-url>
cd dca
```

2. Docker Compose로 애플리케이션을 빌드하고 실행합니다:

```bash
docker-compose up -d
```

3. 브라우저에서 다음 주소로 접속합니다:

```
http://localhost:10040
```

### 중지 방법

```bash
docker-compose down
```

## 개발 환경에서 실행하기

### 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn

### 설치 및 실행

1. 의존성을 설치합니다:

```bash
npm install
# 또는
yarn install
```

2. 개발 서버를 실행합니다:

```bash
npm run dev
# 또는
yarn dev
```

3. 브라우저에서 다음 주소로 접속합니다:

```
http://localhost:3000
```

## 기술 스택

- Next.js
- React
- TypeScript
- Chakra UI
- Recharts
- Binance API