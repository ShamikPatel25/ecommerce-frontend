export default function StockIndicator({ stock }) {
    const qty = stock ?? 0;
    const MAX = 100;
    const pct = Math.min((qty / MAX) * 100, 100);

    return (
        <div className="w-full min-w-[90px]">
            <div className="w-full h-2 rounded-full bg-orange-100">
                <div
                    className="h-2 rounded-full bg-orange-500 transition-all duration-300"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}
