const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

let sql;

function getDb() {
    if (!sql) {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL is not set');
        }
        sql = neon(process.env.DATABASE_URL);
    }
    return sql;
}

async function initDb() {
    const sql = getDb();

    // Таблица пользователей — проверяем ВСЕ нужные столбцы
    let usersOk = false;
    try {
        await sql`SELECT id, email, password_hash, salt FROM users LIMIT 0`;
        usersOk = true;
    } catch {
        usersOk = false;
    }

    if (!usersOk) {
        await sql`DROP TABLE IF EXISTS users CASCADE`;
        await sql`
            CREATE TABLE users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
    }

    // Таблица записей
    const tableCheck = await sql`
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'entries'
        ) AS ex
    `;

    if (tableCheck[0].ex) {
        // Добавить user_id если нет
        const colCheck = await sql`
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'entries' AND column_name = 'user_id'
            ) AS ex
        `;
        if (!colCheck[0].ex) {
            await sql`ALTER TABLE entries ADD COLUMN user_id TEXT DEFAULT 'legacy'`;
        }
    } else {
        await sql`
            CREATE TABLE entries (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL DEFAULT 'legacy',
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
}

// Хэширование пароля
function hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function createSalt() {
    return crypto.randomBytes(32).toString('hex');
}

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
        if (Date.now() - timestamp > 30 * 24 * 60 * 60 * 1000) return null;
        return userId;
    } catch {
        return null;
    }
}

function getUserId(req) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return null;
    return verifyToken(auth.slice(7));
}

module.exports = { getDb, initDb, hashPassword, createSalt, createToken, verifyToken, getUserId };
