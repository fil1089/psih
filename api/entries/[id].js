const { getDb, initDb, getUserId } = require('../db');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

    try {
        await initDb();
        const sql = getDb();

        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Missing entry ID' });

        // Удаляем только свои записи
        await sql`DELETE FROM entries WHERE id = ${id} AND user_id = ${userId}`;

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('API error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
