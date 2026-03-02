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
        const { action, username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Логин и пароль обязательны' });
        }

        if (username.length < 3 || username.length > 30) {
            return res.status(400).json({ error: 'Логин: 3–30 символов' });
        }
        if (password.length < 4) {
            return res.status(400).json({ error: 'Пароль: минимум 4 символа' });
        }

        // ====== РЕГИСТРАЦИЯ ======
        if (action === 'register') {
            // Проверить, существует ли уже
            const existing = await sql`SELECT id FROM users WHERE username = ${username.toLowerCase()}`;
            if (existing.length > 0) {
                return res.status(409).json({ error: 'Этот логин уже занят' });
            }

            const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
            const salt = createSalt();
            const passwordHash = hashPassword(password, salt);

            await sql`
                INSERT INTO users (id, username, password_hash, salt)
                VALUES (${id}, ${username.toLowerCase()}, ${passwordHash}, ${salt})
            `;

            const token = createToken(id);
            return res.status(201).json({ success: true, token, username: username.toLowerCase() });
        }

        // ====== ВХОД ======
        if (action === 'login') {
            const users = await sql`SELECT id, password_hash, salt FROM users WHERE username = ${username.toLowerCase()}`;
            if (users.length === 0) {
                return res.status(401).json({ error: 'Неверный логин или пароль' });
            }

            const user = users[0];
            const checkHash = hashPassword(password, user.salt);
            if (checkHash !== user.password_hash) {
                return res.status(401).json({ error: 'Неверный логин или пароль' });
            }

            const token = createToken(user.id);
            return res.status(200).json({ success: true, token, username: username.toLowerCase() });
        }

        return res.status(400).json({ error: 'Укажите action: login или register' });
    } catch (err) {
        console.error('Auth error:', err);
        return res.status(500).json({ error: 'Ошибка сервера' });
    }
};
