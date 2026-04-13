import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { DBDailyRecord } from '../types';
import { formatJP } from '../utils/date';

export default function ProgressChart({ records }: { records: DBDailyRecord[] }) {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const chartData = useMemo(() => {
    const slice = viewMode === 'week' ? records.slice(-7) : records.slice(-30);
    return slice.map(r => ({ date: formatJP(r.date), '体重(kg)': r.weight, '距離(km)': r.distance }));
  }, [records, viewMode]);

  return (
    <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />進捗グラフ
        </h2>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {(['week', 'month'] as const).map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                viewMode === mode ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {mode === 'week' ? '週間' : '月間'}
            </button>
          ))}
        </div>
      </div>
      {chartData.length === 0 ? (
        <div className="h-44 flex flex-col items-center justify-center text-slate-300">
          <TrendingUp className="w-10 h-10 mb-2" />
          <p className="text-sm">まだ記録がありません</p>
        </div>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={8} />
              <YAxis yAxisId="l" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} domain={['dataMin - 1', 'dataMax + 1']} width={36} />
              <YAxis yAxisId="r" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} domain={['dataMin - 0.5', 'dataMax + 0.5']} width={36} />
              <Tooltip contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12)', fontSize: '12px' }} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '14px', fontSize: '12px' }} />
              <Line yAxisId="l" type="monotone" dataKey="体重(kg)" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3.5, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
              <Line yAxisId="r" type="monotone" dataKey="距離(km)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3.5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
