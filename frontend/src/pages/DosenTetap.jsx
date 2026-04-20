import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import { getDosenTetap, createDosenTetap, updateDosenTetap, deleteDosenTetap, getStats } from '../api/api';

const defaultDocuments = {
  "KTP": false, "Surat Perjanjian DT": false, "Surat Penugasan Rector": false,
  "Pernyataan EWMP": false, "CV": false, "SIP": false, "STR": false,
  "Sertifikat Pelatihan": false, "Ijazah S1": false, "Ijazah Profesi": false,
  "Ijazah S2": false, "Transkrip S1": false, "Transkrip Profesi": false, "Transkrip S2": false
};

export default function DosenTetap() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadData();
    loadStats();
  }, []);

  const loadData = async () => {
    try {
      const res = await getDosenTetap();
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
        await updateDosenTetap(id, editData);
      } else {
        await createDosenTetap(editData);
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
      await deleteDosenTetap(id);
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
        title="Dosen Tetap"
        description="Manajemen kelengkapan berkas administrasi dan sertifikasi dosen program sarjana."
        data={data}
        loading={loading}
        onRefresh={loadData}
        onSave={handleSave}
        onDelete={handleDelete}
        defaultDocuments={defaultDocuments}
        sdmType="dosenTetap"
      />
    </Layout>
  );
}
