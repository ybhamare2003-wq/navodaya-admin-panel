import { useEffect, useState } from 'react';
import StatCard from "./StatCards.tsx";

type GroupStatsResponse = {
    totalGroups: number;

    stateGroups: number;
    districtGroups: number;

    schoolGroups: number;
    schoolBatchGroups: number;

    workStateGroups: number;
    workDistrictGroups: number;
};

export default function GroupStats() {
    const [stats, setStats] =
        useState<GroupStatsResponse | null>(null);

    const [error, setError] = useState('');

    useEffect(() => {
        async function loadStats() {
            try {
                const res = await fetch('/api/groups');

                const data = await res.json();

                setStats(data);
            } catch (err) {
                console.error(err);

                setError('Failed to load group stats');
            }
        }

        loadStats();
    }, []);

    if (error) {
        return (
            <div className="text-red-400 mb-10">
                {error}
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-slate-400 mb-10">
                Loading group stats...
            </div>
        );
    }

    return (
        <div className="mb-12">
            <div className="mb-6">
                <h2 className="text-2xl font-bold">
                    Groups
                </h2>

                <p className="text-slate-400 text-sm mt-1">
                    Community and networking groups overview
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard
                    title="Total Groups"
                    value={stats.totalGroups}
                />

                <StatCard
                    title="State Groups"
                    value={stats.stateGroups}
                />

                <StatCard
                    title="District Groups"
                    value={stats.districtGroups}
                />

                <StatCard
                    title="School Groups"
                    value={stats.schoolGroups}
                />

                <StatCard
                    title="School Batch Groups"
                    value={stats.schoolBatchGroups}
                />

                <StatCard
                    title="Work State Groups"
                    value={stats.workStateGroups}
                />

                <StatCard
                    title="Work District Groups"
                    value={stats.workDistrictGroups}
                />
            </div>
        </div>
    );
}