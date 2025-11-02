# Настройка SOCKS5 прокси для Groq API

## 1. Установить зависимости

```bash
npm install
```

## 2. Добавить в .env файл

```
GROQ_SOCKS_PROXY=socks5h://127.0.0.1:1080
```

## 3. Запустить Shadowsocks прокси

```bash
docker-compose up -d
```

## 4. Проверить работу прокси

```bash
# Проверить что прокси слушает на порту 1080
netstat -tlnp | grep 1080

# Или проверить через curl
curl --socks5 127.0.0.1:1080 https://api.groq.com
```

## 5. Запустить приложение

```bash
npm run dev
```

## Конфигурация Shadowsocks

- **Сервер:** 188.214.37.76:8443
- **Метод:** chacha20-ietf-poly1305
- **Локальный SOCKS5:** 127.0.0.1:1080

## Остановка прокси

```bash
docker-compose down
```
