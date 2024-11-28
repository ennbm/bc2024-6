# Використовуємо офіційний образ Node.js
FROM node:16

# Встановлюємо робочу директорію всередині контейнера
WORKDIR /app

# Копіюємо файли package.json та package-lock.json
COPY package*.json ./

# Встановлюємо залежності
RUN npm install

# Копіюємо решту файлів
COPY . .

# Встановлюємо nodemon як глобальну залежність
RUN npm install -g nodemon

# Відкриваємо порт, якщо потрібно
EXPOSE 3000

# Запускаємо сервер через nodemon
CMD ["nodemon", "server.js"]
