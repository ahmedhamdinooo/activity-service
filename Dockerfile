FROM node:20-bullseye

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# تأكد أن الملف موجود
RUN ls -l /app/wait-for-kafka.js

CMD ["node", "src/index.js"]
