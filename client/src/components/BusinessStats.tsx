import { useEffect, useState } from 'react';
import StatCard from "./StatCards.tsx";

type BusinessStats = {
    totalBusinesses: number;
};

export default function BusinessStats() {
    const [stats, setStats] =
        useState<BusinessStats | null>(null);

    useEffect(() => {
        fetch('/api/businesses')
            .then((res) => res.json())
            .then((data) => setStats(data));
    }, []);

    if (!stats) {
        return null;
    }

    return (
        <div className="mt-10">
            <h2 className="text-2xl font-bold mb-6">
                Businesses
            </h2>

            <div className="grid grid-cols-1 gap-6">
                <StatCard
                    title="Total Businesses"
                    value={stats.totalBusinesses}
                />
            </div>
        </div>
    );
}