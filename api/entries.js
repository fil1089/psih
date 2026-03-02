const { getDb, initDb, getUserId } = require('./db');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        await initDb();
        const sql = getDb();

        // Проверка авторизации
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (req.method === 'GET') {
            const rows = await sql`
                SELECT id, date, day_key, time_of_day, emotions, happy_text, notes
                FROM entries
                WHERE user_id = ${userId}
                ORDER BY date DESC
            `;
            return res.status(200).json(rows);
        }

        if (req.method === 'POST') {
            const { id, date, dayKey, timeOfDay, emotions, happyText, notes } = req.body;

            if (!id || !date || !dayKey || !timeOfDay || !emotions) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            await sql`
                INSERT INTO entries (id, user_id, date, day_key, time_of_day, emotions, happy_text, notes)
                VALUES (${id}, ${userId}, ${date}, ${dayKey}, ${timeOfDay}, ${JSON.stringify(emotions)}, ${happyText || ''}, ${notes || ''})
            `;

            return res.status(201).json({ success: true, id });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('API error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
