import { useEffect, useState } from 'react';
import StatCard from './StatCards.tsx';

type Stats = {
    totalUsers: number;
    activeUsers: number;
    usersWithProfile: number;
};

export default function UserStats() {
    const [stats, setStats] =
        useState<Stats | null>(null);

    const [error, setError] = useState('');

    useEffect(() => {
        async function loadStats() {
            try {

                const res = await fetch('/api/users');

                const data = await res.json();

                setStats(data);
            } catch (err) {
                console.error(err);
                setError('Failed to load stats');
            }
        }

        loadStats();
    }, []);

    if (error) {
        return (
            <div className="text-red-400">
                {error}
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-slate-400">
                Loading user stats...
            </div>
        );
    }

    return (
        <div className="mb-10">
            <h2 className="text-2xl font-bold mb-6">
                Users
            </h2>

            <div className="grid grid-cols-3 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                />

                <StatCard
                    title="Active Users"
                    value={stats.activeUsers}
                />

                <StatCard
                    title="Users With Profile"
                    value={stats.usersWithProfile}
                />
            </div>
        </div>
    );
}