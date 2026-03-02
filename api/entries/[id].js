const { getDb, initDb } = require('../db');

module.exports = async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await initDb();
        const sql = getDb();
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ error: 'Missing entry ID' });
        }

        await sql`DELETE FROM entries WHERE id = ${id}`;

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('API error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
