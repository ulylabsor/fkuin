import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import { getTendik, createTendik, updateTendik, deleteTendik, getStats } from '../api/api';

const defaultDocuments = {
  "KTP": false, "Ijazah": false, "Transkrip": false, "Sertifikat": false, "Surat Pernyataan": false
};

export default function Tendik() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadData();
    loadStats();
  }, []);

  const loadData = async () => {
    try {
      const res = await getTendik();
      setData(res.data);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await getStats();
      setStats(res.data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleSave = async (id, editData) => {
    try {
      if (id) {
        await updateTendik(id, editData);
      } else {
        await createTendik(editData);
      }
      await loadData();
      await loadStats();
    } catch (err) {
      console.error('Error saving data:', err);
      alert('Gagal menyimpan data');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTendik(id);
      await loadData();
      await loadStats();
    } catch (err) {
      console.error('Error deleting data:', err);
      alert('Gagal menghapus data');
    }
  };

  return (
    <Layout stats={stats}>
      <DataTable
        title="Tendik & Laboran"
        description="Manajemen kelengkapan berkas administrasi dan sertifikasi tenaga pendidik dan kependidikan."
        data={data}
        loading={loading}
        onRefresh={loadData}
        onSave={handleSave}
        onDelete={handleDelete}
        defaultDocuments={defaultDocuments}
        sdmType="tendik"
      />
    </Layout>
  );
}
