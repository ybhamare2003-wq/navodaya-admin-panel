import { Router } from 'express';
import { pool } from '../db';

const router = Router();

router.get('/', async (_, res) => {
    try {
        const totalBusinessesQuery = pool.query(`
      SELECT COUNT(*) FROM businesses
    `);

        const totalServicesQuery = pool.query(`
      SELECT COUNT(*) FROM services
    `);

        const businessesWithServicesQuery = pool.query(`
      SELECT COUNT(DISTINCT business_id)
      FROM services
    `);

        const [
            totalBusinesses,
            totalServices,
            businessesWithServices,
        ] = await Promise.all([
            totalBusinessesQuery,
            totalServicesQuery,
            businessesWithServicesQuery,
        ]);

        res.json({
            totalBusinesses: Number(
                totalBusinesses.rows[0].count
            ),
            totalServices: Number(
                totalServices.rows[0].count
            ),
            businessesWithServices: Number(
                businessesWithServices.rows[0].count
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