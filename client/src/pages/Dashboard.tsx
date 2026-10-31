import { useQuery } from '@tanstack/react-query';
import { Activity, UserCheck, BriefcaseBusiness, MessageCircle, RefreshCw, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, type AdminStats } from '../api/client';
import NotificationPanel from '../components/NotificationPanel';

const numberFormat = new Intl.NumberFormat();

export default function Dashboard() {
    const { data, error, isPending, refetch, isFetching } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => (await api.get<AdminStats>('/stats')).data,
        refetchInterval: 60_000,
    });

    const groupRows = data ? [
        ['State groups', data.totalStateGroups],
        ['District groups', data.totalDistrictGroups],
        ['School groups', data.totalSchoolGroups],
        ['School batch groups', data.totalSchoolBatchGroups],
        ['Work state groups', data.totalWorkStateGroups],
        ['Work district groups', data.totalWorkDistrictGroups],
    ] as const : [];

    const cards = data ? [
        { label: 'Total users', value: data.totalUsers, icon: Users, tone: 'violet' },
        { label: 'Active users', value: data.totalActiveUsers, icon: UserCheck, tone: 'teal' },
        { label: 'Users with profiles', value: data.totalUsersWithProfiles, icon: Activity, tone: 'blue' },
        { label: 'Businesses', value: data.totalBusinesses, icon: BriefcaseBusiness, tone: 'orange' },
        { label: 'Posts', value: data.totalPosts, icon: MessageCircle, tone: 'green' },
        { label: 'Conversation groups', value: data.totalConversationGroups, icon: Users, tone: 'pink' },
    ] : [];

    return (
        <div className="page-stack">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">OVERVIEW</p>
                    <h1>Dashboard</h1>
                    <p className="muted">A snapshot of activity across the Navodaya Clap platform.</p>
                </div>
                <button className="button button-secondary refresh-button" onClick={() => void refetch()} disabled={isFetching}>
                    <RefreshCw size={16} className={isFetching ? 'spin-icon' : ''} />
                    {isFetching ? 'Refreshing' : 'Refresh'}
                </button>
            </div>

            {isPending && <div className="loading-panel"><span className="spinner" />Loading platform stats…</div>}
            {error && <div className="alert alert-error" role="alert">Couldn’t load dashboard stats. {error instanceof Error ? error.message : 'Please try again.'}</div>}
            {data && <>
                <section className="stats-grid" aria-label="Platform overview">
                    {cards.map(({ label, value, icon: Icon, tone }) => (
                        <article className="stat-card" key={label}>
                            <div className={`stat-icon ${tone}`}><Icon size={19} /></div>
                            <p>{label}</p>
                            <strong>{numberFormat.format(value)}</strong>
                        </article>
                    ))}
                </section>

                <div className="dashboard-grid">
                    <section className="panel chart-panel">
                        <div className="panel-heading">
                            <div><h2>Posts by type</h2><p className="muted">Published content breakdown</p></div>
                            <span className="panel-icon"><MessageCircle size={18} /></span>
                        </div>
                        <div className="chart-area">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    { name: 'Regular', posts: data.postsByType.REGULAR },
                                    { name: 'Jobs', posts: data.postsByType.JOB },
                                    { name: 'Blood', posts: data.postsByType.BLOOD },
                                ]} margin={{ top: 10, right: 12, bottom: 0, left: -18 }}>
                                    <CartesianGrid stroke="#242b3b" vertical={false} />
                                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#8f98ab', fontSize: 12 }} />
                                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#8f98ab', fontSize: 12 }} />
                                    <Tooltip cursor={{ fill: '#ffffff08' }} contentStyle={{ background: '#171c29', border: '1px solid #2b3344', borderRadius: 10, color: '#f4f6fb' }} />
                                    <Bar dataKey="posts" fill="#8b7bff" radius={[6, 6, 0, 0]} maxBarSize={54} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    <section className="panel groups-panel">
                        <div className="panel-heading">
                            <div><h2>Groups breakdown</h2><p className="muted">Community and professional groups</p></div>
                            <span className="panel-icon"><Users size={18} /></span>
                        </div>
                        <div className="group-list">
                            {groupRows.map(([label, count]) => (
                                <div className="group-row" key={label}>
                                    <span>{label}</span>
                                    <strong>{numberFormat.format(count)}</strong>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </>}
            <NotificationPanel />
        </div>
    );
}
