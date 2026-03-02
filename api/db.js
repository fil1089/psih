const { neon } = require('@neondatabase/serverless');

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
        CREATE TABLE IF NOT EXISTS entries (
            id TEXT PRIMARY KEY,
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

module.exports = { getDb, initDb };
