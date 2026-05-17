import { Router } from 'express';
import { pool } from '../db';

const router = Router();

router.get('/', async (_, res) => {
    try {
        const totalUsersQuery = pool.query(`
      SELECT COUNT(*) FROM users
    `);

        const activeUsersQuery = pool.query(`
      SELECT COUNT(*) FROM users
      WHERE is_active = true
    `);

        const usersWithProfileQuery = pool.query(`
      SELECT COUNT(*) FROM users as u
          inner join profiles as p on u.id = p.user_id
    `);

        const [
            totalUsers,
            activeUsers,
            usersWithProfile,
        ] = await Promise.all([
            totalUsersQuery,
            activeUsersQuery,
            usersWithProfileQuery,
        ]);

        res.json({
            totalUsers: Number(totalUsers.rows[0].count),
            activeUsers: Number(activeUsers.rows[0].count),
            usersWithProfile: Number(
                usersWithProfile.rows[0].count
            ),
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: 'Failed to fetch stats',
        });
    }
});

export default router;