import { Router } from 'express';
import { pool } from '../db';

const router = Router();

router.get('/', async (_, res) => {
    try {
        const totalPostsQuery = pool.query(`
      SELECT COUNT(*) FROM posts
    `);

        const totalBloodPostsQuery = pool.query(`
      SELECT COUNT(*) FROM posts
      WHERE post_type = 'BLOOD'
    `);

        const totalResolvedBloodPostsQuery = pool.query(`
            SELECT COUNT(*) FROM posts as p
                inner join blood_posts as bp on p.id = bp.post_id
            WHERE post_type = 'BLOOD' AND bp.is_resolved = true
        `);

        const totalJobPostsQuery = pool.query(`
            SELECT COUNT(*) FROM posts
            WHERE post_type = 'JOB'
    `);

        const totalRegularPostsQuery = pool.query(`
            SELECT COUNT(*) FROM posts
            WHERE post_type = 'REGULAR'
    `);

        const [
            totalPosts,
            totalBloodPosts,
            totalJobPosts,
            totalRegularPosts,
            totalResolvedBloodPosts
        ] = await Promise.all([
            totalPostsQuery,
            totalBloodPostsQuery,
            totalJobPostsQuery,
            totalRegularPostsQuery,
            totalResolvedBloodPostsQuery
        ]);

        res.json({
            totalPosts: Number(totalPosts.rows[0].count),
            totalBloodPosts: Number(totalBloodPosts.rows[0].count),
            totalResolvedBloodPosts: Number(totalResolvedBloodPosts.rows[0].count),
            totalJobPosts: Number(
                totalJobPosts.rows[0].count
            ),
            totalRegularPosts: Number(
                totalRegularPosts.rows[0].count
            ),
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: 'Failed to fetch posts',
        });
    }
});

export default router;