import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStats } from '../api/api';
import AdminLayout from '../components/AdminLayout';
import {
  GraduationCap,
  Stethoscope,
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await getStats();
      setStats(res.data);
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, total, complete, incomplete, avgPercent, color, bgColor }) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <span className="text-2xl font-bold text-slate-900">{total}</span>
      </div>
      <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Dokumen Lengkap</span>
          <span className="font-semibold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            {complete}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Perlu Tindakan</span>
          <span className="font-semibold text-amber-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {incomplete}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Rata-rata</span>
          <span className="font-semibold text-slate-700">{avgPercent}%</span>
        </div>
      </div>
      <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${avgPercent}%` }}
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="w-full">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-2">
            Dashboard Overview
          </h2>
          <p className="text-slate-500">
            Ringkasan kelengkapan dokumen seluruh personel FK UIN Raden Fatah Palembang.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatCard
            icon={GraduationCap}
            title="Dosen Sarjana"
            total={stats?.dosenSarjana?.total || 0}
            complete={stats?.dosenSarjana?.complete || 0}
            incomplete={stats?.dosenSarjana?.incomplete || 0}
            avgPercent={stats?.dosenSarjana?.avgPercentage || 0}
            color="text-blue-600"
            bgColor="bg-blue-100"
          />
          <StatCard
            icon={Stethoscope}
            title="Pembimbing Klinik"
            total={stats?.pembimbingKlinik?.total || 0}
            complete={stats?.pembimbingKlinik?.complete || 0}
            incomplete={stats?.pembimbingKlinik?.incomplete || 0}
            avgPercent={stats?.pembimbingKlinik?.avgPercentage || 0}
            color="text-purple-600"
            bgColor="bg-purple-100"
          />
          <StatCard
            icon={Users}
            title="Tendik & Laboran"
            total={stats?.tendik?.total || 0}
            complete={stats?.tendik?.complete || 0}
            incomplete={stats?.tendik?.incomplete || 0}
            avgPercent={stats?.tendik?.avgPercentage || 0}
            color="text-orange-600"
            bgColor="bg-orange-100"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Aksi Cepat
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/admin/dosen-sarjana"
              className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <div>
                <p className="font-semibold text-slate-900">Kelola Dosen Sarjana</p>
                <p className="text-sm text-slate-500">{stats?.dosenSarjana?.total || 0} data</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400" />
            </Link>
            <Link
              to="/admin/pembimbing-klinik"
              className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <div>
                <p className="font-semibold text-slate-900">Kelola Pembimbing Klinik</p>
                <p className="text-sm text-slate-500">{stats?.pembimbingKlinik?.total || 0} data</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400" />
            </Link>
            <Link
              to="/admin/tendik"
              className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <div>
                <p className="font-semibold text-slate-900">Kelola Tendik & Laboran</p>
                <p className="text-sm text-slate-500">{stats?.tendik?.total || 0} data</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-emerald-900">
                Total {stats?.grandTotal?.total || 0} Personel
              </p>
              <p className="text-sm text-emerald-700">
                {stats?.grandTotal?.complete || 0} dengan dokumen lengkap,{' '}
                {stats?.grandTotal?.total - stats?.grandTotal?.complete || 0} perlu dilengkapi
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
