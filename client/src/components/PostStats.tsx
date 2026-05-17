import { useEffect, useState } from 'react';
import StatCard from "./StatCards.tsx";

type PostStatsResponse = {
    totalPosts: number;
    totalBloodPosts: number;
    totalResolvedBloodPosts: number;
    totalJobPosts: number;
    totalRegularPosts: number;
};

export default function PostStats() {
    const [stats, setStats] =
        useState<PostStatsResponse | null>(null);

    const [error, setError] = useState('');

    useEffect(() => {
        async function loadStats() {
            try {
                const res = await fetch('/api/posts');

                const data = await res.json();

                setStats(data);
            } catch (err) {
                console.error(err);

                setError('Failed to load post stats');
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
                Loading post stats...
            </div>
        );
    }

    return (
        <div className="mb-12 pt-12">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold">
                        Posts
                    </h2>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
                <StatCard
                    title="Total Posts"
                    value={stats.totalPosts}
                />

                <StatCard
                    title="Blood Requests"
                    value={stats.totalBloodPosts}
                />

                <StatCard
                    title="Resolved Blood Posts"
                    value={stats.totalResolvedBloodPosts}
                />

                <StatCard
                    title="Job Posts"
                    value={stats.totalJobPosts}
                />

                <StatCard
                    title="Regular Posts"
                    value={stats.totalRegularPosts}
                />
            </div>
        </div>
    );
}