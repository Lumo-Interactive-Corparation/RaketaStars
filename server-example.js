// Пример серверного API для обработки Telegram Stars платежей
// server-example.js

const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
app.use(express.json());

// Конфигурация
const BOT_TOKEN = '7259803241:AAEHAkgHZSJzLr_a5zsR96S5w5oSpmXYkKM'; // Ваш токен бота
const WEBAPP_URL = 'https://lumo-interactive-corparation.github.io/RaketaStars/'; // URL вашего веб-приложения

// Цены на премиум подписку в Telegram Stars
const PREMIUM_PRICES = {
    1: { stars: 189, label: 'Месяц премиума' },    // 189 звезд за месяц
    12: { stars: 2268, label: 'Год премиума' }     // 2268 звезд за год
};

// Функция для проверки Telegram init data
function verifyTelegramWebAppData(initData, botToken) {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    
    const dataCheckString = Array.from(urlParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    return calculatedHash === hash;
}

// API endpoint для создания Stars инвойса
app.post('/api/create-stars-invoice', async (req, res) => {
    try {
        const { user_id, duration, stars, title, description, payload, photo_url } = req.body;
        const initData = req.headers['x-telegram-init-data'];
        
        // Проверяем подлинность данных от Telegram
        if (!verifyTelegramWebAppData(initData, BOT_TOKEN)) {
            return res.status(401).json({
                success: false,
                error: 'Неавторизованный запрос'
            });
        }
        
        // Валидация цен
        const validPrice = PREMIUM_PRICES[duration];
        if (!validPrice || stars !== validPrice.stars) {
            return res.status(400).json({
                success: false,
                error: `Неверная цена. Ожидается ${validPrice ? validPrice.stars : 'неизвестно'} звезд для ${duration} месяц(ев)`
            });
        }
        
        // Создаем инвойс через Telegram Bot API
        const invoiceData = {
            chat_id: user_id,
            title: title,
            description: description,
            payload: payload,
            currency: 'XTR', // Telegram Stars
            prices: [{ label: validPrice.label, amount: validPrice.stars }],
            photo_url: photo_url,
            photo_size: 512,
            photo_width: 512,
            photo_height: 512,
            need_name: false,
            need_phone_number: false,
            need_email: false,
            need_shipping_address: false,
            send_phone_number_to_provider: false,
            send_email_to_provider: false,
            is_flexible: false
        };
        
        const response = await axios.post(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendInvoice`,
            invoiceData
        );
        
        if (response.data.ok) {
            // Сохраняем информацию о платеже в базе данных
            // await savePaymentInfo(user_id, payload, validPrice.stars, duration);
            
            res.json({
                success: true,
                invoice_link: `https://t.me/invoice/${response.data.result.message_id}`,
                message_id: response.data.result.message_id
            });
        } else {
            throw new Error(response.data.description || 'Ошибка создания инвойса');
        }
        
    } catch (error) {
        console.error('Error creating invoice:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Внутренняя ошибка сервера'
        });
    }
});

// Webhook для обработки успешных платежей
app.post('/webhook/telegram', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const update = JSON.parse(req.body);
        
        // Обработка успешного платежа
        if (update.pre_checkout_query) {
            // Подтверждаем pre-checkout
            await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`, {
                pre_checkout_query_id: update.pre_checkout_query.id,
                ok: true
            });
        }
        
        if (update.message && update.message.successful_payment) {
            const payment = update.message.successful_payment;
            const userId = update.message.from.id;
            
            // Парсим payload для получения информации о покупке
            const payloadData = payment.invoice_payload.split('_');
            if (payloadData[0] === 'premium' && payloadData[2] === 'months') {
                const duration = parseInt(payloadData[1]);
                
                // Активируем премиум для пользователя
                // await activatePremiumForUser(userId, duration);
                
                // Отправляем подтверждение пользователю
                await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                    chat_id: userId,
                    text: `🎉 Премиум подписка активирована на ${duration === 1 ? '1 месяц' : '12 месяцев'}!\n\nТеперь вы получаете:\n🚀 Больше звезд за запуск (50-599)\n👥 Увеличенные реферальные бонусы\n🎯 Эксклюзивные задания\n⭐ Случайные бонусные звезды`,
                    parse_mode: 'HTML'
                });
                
                console.log(`Premium activated for user ${userId} for ${duration} months`);
            }
        }
        
        res.status(200).send('OK');
        
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Error');
    }
});

// Статические файлы (ваше веб-приложение)
app.use(express.static('public'));

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Webhook URL: https://your-domain.com/webhook/telegram`);
});

module.exports = app; 