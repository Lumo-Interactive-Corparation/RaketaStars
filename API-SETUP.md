# Настройка API для Telegram Stars

## Что изменилось

✅ **Реальный API вызов** вместо симуляции
✅ **Проверка подлинности** Telegram данных  
✅ **Обработка ошибок** с понятными сообщениями
✅ **Webhook** для обработки успешных платежей
✅ **Реальные цены**: 189⭐ за месяц, 2268⭐ за год

## Быстрый старт

### 1. Установите зависимости
```bash
npm install express axios
```

### 2. Настройте бота
1. Получите токен бота у [@BotFather](https://t.me/BotFather)
2. Токен бота: `7259803241:AAEHAkgHZSJzLr_a5zsR96S5w5oSpmXYkKM`
3. Mini App URL: `https://lumo-interactive-corparation.github.io/RaketaStars/`
4. Настройте webhook: `/setwebhook?url=https://your-domain.com/webhook/telegram`

### 3. Цены на премиум
```javascript
const PREMIUM_PRICES = {
    1: { stars: 189, label: 'Месяц премиума' },    // 189 звезд за месяц
    12: { stars: 2268, label: 'Год премиума' }     // 2268 звезд за год
};
```

### 4. Разместите файлы
```
your-server/
├── server-example.js      # Серверный код
├── package.json          # Зависимости
└── public/              # Ваши HTML/CSS/JS файлы
    ├── index.html
    ├── script.js
    └── styles.css
```

### 5. Запустите сервер
```bash
node server-example.js
```

## Как это работает

### Клиентская часть (script.js)
```javascript
// Реальные цены
const prices = {
    1: { stars: 189, label: 'Месяц премиума' },
    12: { stars: 2268, label: 'Год премиума' }
};

// Реальный API вызов
const response = await fetch('/api/create-stars-invoice', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': tg.initData
    },
    body: JSON.stringify({
        user_id: userId,
        duration: duration,
        stars: invoice.prices[0].amount,
        // ... другие данные
    })
});
```

### Реферальные ссылки
```javascript
// Новый формат ссылок на Mini App
const referralLink = `https://lumo-interactive-corparation.github.io/RaketaStars/?ref=user${userId}`;
```

### Серверная часть (server-example.js)
1. **Проверяет подлинность** запроса от Telegram
2. **Валидирует цены** с реальными значениями
3. **Создает инвойс** через Bot API `sendInvoice`
4. **Возвращает ссылку** на инвойс
5. **Обрабатывает платежи** через webhook

## Безопасность

✅ Проверка Telegram init data  
✅ Валидация цен на сервере
✅ Валидация пользовательских данных  
✅ Обработка ошибок без раскрытия внутренней информации  
✅ HTTPS обязателен для продакшена  

## Продакшен

### Переменные окружения
```bash
BOT_TOKEN=7259803241:AAEHAkgHZSJzLr_a5zsR96S5w5oSpmXYkKM
WEBAPP_URL=https://lumo-interactive-corparation.github.io/RaketaStars/
PORT=3000
```

### Hosting рекомендации
- **Vercel** - простое развертывание
- **Railway** - с поддержкой Node.js
- **Heroku** - классический вариант
- **VPS** - максимальный контроль

### SSL сертификат
Telegram требует HTTPS для webhook'ов. Используйте:
- Let's Encrypt (бесплатный)
- Cloudflare (бесплатный план)
- Сертификат от хостинга

## Отладка

### Логи платежей
```javascript
console.log('Payment received:', {
    user_id: userId,
    amount: payment.total_amount,
    currency: payment.currency,
    payload: payment.invoice_payload,
    expected_stars: PREMIUM_PRICES[duration].stars
});
```

### Тестирование
1. Используйте тестовый режим бота
2. Проверьте webhook через ngrok для локальной разработки
3. Мониторьте логи сервера

## База данных (опционально)

Для сохранения информации о платежах добавьте:
```javascript
// Пример с MongoDB
const { MongoClient } = require('mongodb');

async function savePaymentInfo(userId, payload, stars, duration) {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db('raketastars');
    await db.collection('payments').insertOne({
        user_id: userId,
        payload: payload,
        stars: stars,
        duration: duration,
        created_at: new Date(),
        status: 'pending'
    });
    
    await client.close();
}
```

## Поддержка

При возникновении проблем проверьте:
1. Правильность токена бота
2. Настройку webhook'а
3. HTTPS сертификат
4. Логи сервера
5. Соответствие цен на клиенте и сервере

**Готово!** Теперь у вас есть полноценный API для обработки Telegram Stars платежей с реальными ценами. 🚀

## Обновления

✅ **Цены обновлены**: 189⭐ за месяц, 2268⭐ за год  
✅ **Mini App ссылка**: [https://lumo-interactive-corparation.github.io/RaketaStars/](https://lumo-interactive-corparation.github.io/RaketaStars/)  
✅ **Валидация цен** на сервере  
✅ **Реферальные ссылки** обновлены на Mini App формат 