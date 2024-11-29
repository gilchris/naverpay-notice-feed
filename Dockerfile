# 베이스 이미지로 Node.js 20을 사용
FROM node:20-bullseye

# 작업 디렉토리 생성
WORKDIR /usr/src/app

# package.json과 package-lock.json을 컨테이너에 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 앱 코드 복사
COPY . .

# Git 설치
RUN apt-get update && apt-get install -y git && \
    mkdir -p /data/gilchris.github.io && \
    git config --global --add safe.directory /data/gilchris.github.io

# 애플리케이션 실행
CMD ["/bin/bash", "run.sh"]
