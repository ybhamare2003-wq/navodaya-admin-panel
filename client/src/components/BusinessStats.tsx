import { useEffect, useState } from 'react';
import StatCard from "./StatCards.tsx";

type BusinessStats = {
    totalBusinesses: number;
    totalServices: number;
    businessesWithServices: number;
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

            <div className="grid grid-cols-3 gap-6">
                <StatCard
                    title="Total Businesses"
                    value={stats.totalBusinesses}
                />

                <StatCard
                    title="Total Services"
                    value={stats.totalServices}
                />

                <StatCard
                    title="Businesses With Services"
                    value={stats.businessesWithServices}
                />
            </div>
        </div>
    );
}