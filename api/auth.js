const { getDb, initDb, hashPassword, createSalt, createToken } = require('./db');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        await initDb();
        const sql = getDb();
        const { action, email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email и пароль обязательны' });
        }

        const emailLower = email.toLowerCase().trim();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
            return res.status(400).json({ error: 'Введите корректный email' });
        }
        if (password.length < 4) {
            return res.status(400).json({ error: 'Пароль: минимум 4 символа' });
        }

        // ====== РЕГИСТРАЦИЯ ======
        if (action === 'register') {
            const existing = await sql`SELECT id FROM users WHERE email = ${emailLower}`;
            if (existing.length > 0) {
                return res.status(409).json({ error: 'Этот email уже зарегистрирован' });
            }

            const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
            const salt = createSalt();
            const passwordHash = hashPassword(password, salt);

            await sql`
                INSERT INTO users (id, email, password_hash, salt)
                VALUES (${id}, ${emailLower}, ${passwordHash}, ${salt})
            `;

            const token = createToken(id);
            return res.status(201).json({ success: true, token, email: emailLower });
        }

        // ====== ВХОД ======
        if (action === 'login') {
            const users = await sql`SELECT id, password_hash, salt FROM users WHERE email = ${emailLower}`;
            if (users.length === 0) {
                return res.status(401).json({ error: 'Неверный email или пароль' });
            }

            const user = users[0];
            const checkHash = hashPassword(password, user.salt);
            if (checkHash !== user.password_hash) {
                return res.status(401).json({ error: 'Неверный email или пароль' });
            }

            const token = createToken(user.id);
            return res.status(200).json({ success: true, token, email: emailLower });
        }

        return res.status(400).json({ error: 'Укажите action: login или register' });
    } catch (err) {
        console.error('Auth error:', err);
        return res.status(500).json({ error: 'Ошибка сервера: ' + err.message });
    }
};
