import UserStats from '../components/UserStats';
import BusinessStats from '../components/BusinessStats';
import PostStats from '../components/PostStats';
import GroupStats from "../components/GroupsStats.tsx";

export default function Dashboard() {
    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-12">
                    <h1 className="text-4xl font-bold">
                        Navodaya Admin
                    </h1>

                    <p className="text-slate-400 mt-2">
                        Platform analytics dashboard
                    </p>
                </div>

                <UserStats />

                <BusinessStats />

                <PostStats />

                <GroupStats />
            </div>
        </div>
    );
}