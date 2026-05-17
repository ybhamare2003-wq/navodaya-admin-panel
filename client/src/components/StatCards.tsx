type Props = {
    title: string;
    value: number;
};

export default function StatCard({
                                     title,
                                     value,
                                 }: Props) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400 text-sm mb-2">
                {title}
            </p>

            <h2 className="text-4xl font-bold">
                {value.toLocaleString()}
            </h2>
        </div>
    );
}