import { Router } from 'express';
import { pool } from '../db';

const router = Router();

router.get('/', async (_, res) => {
    try {
        const totalBusinessesQuery = pool.query(`
            SELECT COUNT(*) FROM businesses
        `);

        const totalBusinesses = await totalBusinessesQuery;

        res.json({
            totalBusinesses: Number(
                totalBusinesses.rows[0].count
            ),
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: 'Failed to fetch business stats',
        });
    }
});

export default router;