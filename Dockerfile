FROM node:18-alpine AS base

# 의존성 설치 단계
FROM base AS deps
WORKDIR /app

# 패키지 파일 복사
COPY package.json package-lock.json* ./

# 메모리 제한을 설정하여 의존성 설치
# --max-old-space-size=512로 Node.js 메모리 사용량 제한
ENV NODE_OPTIONS="--max-old-space-size=512"
RUN npm ci --no-audit --prefer-offline

# 빌드 단계
FROM base AS builder
WORKDIR /app

# 메모리 제한 설정
ENV NODE_OPTIONS="--max-old-space-size=512"

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 빌드 과정에서 메모리 사용량을 줄이기 위한 설정
RUN npm run build

# 실행 단계
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# 실행 시에도 메모리 제한 설정
ENV NODE_OPTIONS="--max-old-space-size=512"

# 필요한 파일만 복사
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 불필요한 파일 제거
RUN rm -rf /tmp/* /var/cache/apk/*

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# 메모리 제한을 설정하여 서버 실행
CMD ["node", "server.js"] 