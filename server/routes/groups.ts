import { Router } from 'express';
import { pool } from '../db';

const router = Router();

router.get('/', async (_, res) => {
    try {
        const groupStatsQuery = await pool.query(`
            SELECT
                type,
                COUNT(*) as count
            FROM conversations
            WHERE type IN (
                'state_group',
                'district_group',
                'school_group',
                'school_batch_group',
                'work_state_group',
                'work_district_group'
            )
            GROUP BY type
        `);

        const statsMap: Record<string, number> = {
            state_group: 0,
            district_group: 0,
            school_group: 0,
            school_batch_group: 0,
            work_state_group: 0,
            work_district_group: 0,
        };

        let totalGroups = 0;

        for (const row of groupStatsQuery.rows) {
            const count = Number(row.count);

            statsMap[row.type] = count;

            totalGroups += count;
        }

        res.json({
            totalGroups,

            stateGroups:
            statsMap.state_group,

            districtGroups:
            statsMap.district_group,

            schoolGroups:
            statsMap.school_group,

            schoolBatchGroups:
            statsMap.school_batch_group,

            workStateGroups:
            statsMap.work_state_group,

            workDistrictGroups:
            statsMap.work_district_group,
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: 'Failed to fetch group stats',
        });
    }
});

export default router;