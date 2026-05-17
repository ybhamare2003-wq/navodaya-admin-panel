import UserStats from '../components/UserStats';
import BusinessStats from '../components/BusinessStats';

export default function Dashboard() {
    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <h1 className="text-4xl font-bold mb-10">
                Navodaya Admin
            </h1>

            <UserStats />

            <BusinessStats />
        </div>
    );
}