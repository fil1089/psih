const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

let sql;

function getDb() {
    if (!sql) {
        sql = neon(process.env.DATABASE_URL);
    }
    return sql;
}

async function initDb() {
    const sql = getDb();
    await sql`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    await sql`
        CREATE TABLE IF NOT EXISTS entries (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id),
            date TIMESTAMPTZ NOT NULL,
            day_key TEXT NOT NULL,
            time_of_day TEXT NOT NULL,
            emotions JSONB NOT NULL DEFAULT '[]',
            happy_text TEXT DEFAULT '',
            notes TEXT DEFAULT '',
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
}

// Хэширование пароля
function hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function createSalt() {
    return crypto.randomBytes(32).toString('hex');
}

// Токен — HMAC(userId:timestamp) с секретом из DATABASE_URL
function createToken(userId) {
    const timestamp = Date.now();
    const secret = process.env.DATABASE_URL || 'fallback-secret';
    const data = `${userId}:${timestamp}`;
    const signature = crypto.createHmac('sha256', secret).update(data).digest('hex');
    return Buffer.from(JSON.stringify({ userId, timestamp, signature })).toString('base64');
}

function verifyToken(token) {
    try {
        const { userId, timestamp, signature } = JSON.parse(Buffer.from(token, 'base64').toString());
        const secret = process.env.DATABASE_URL || 'fallback-secret';
        const expected = crypto.createHmac('sha256', secret).update(`${userId}:${timestamp}`).digest('hex');
        if (signature !== expected) return null;
        // Токен валиден 30 дней
        if (Date.now() - timestamp > 30 * 24 * 60 * 60 * 1000) return null;
        return userId;
    } catch {
        return null;
    }
}

// Получить userId из заголовка Authorization
function getUserId(req) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return null;
    return verifyToken(auth.slice(7));
}

module.exports = { getDb, initDb, hashPassword, createSalt, createToken, verifyToken, getUserId };
