import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import AdminDataTable from '../components/AdminDataTable';
import { getTendik, createTendik, updateTendik, deleteTendik } from '../api/api';

const defaultDocuments = {
  "KTP": false, "Ijazah": false, "Transkrip": false, "Sertifikat": false, "Surat Pernyataan": false
};

export default function AdminTendik() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
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

  const handleSave = async (id, editData) => {
    try {
      if (id) {
        await updateTendik(id, editData);
      } else {
        await createTendik(editData);
      }
      await loadData();
    } catch (err) {
      console.error('Error saving data:', err);
      alert('Gagal menyimpan data');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTendik(id);
      await loadData();
    } catch (err) {
      console.error('Error deleting data:', err);
      alert('Gagal menghapus data');
    }
  };

  return (
    <AdminLayout>
      <AdminDataTable
        title="Tendik & Laboran"
        description="Manajemen kelengkapan berkas administrasi dan sertifikasi tenaga pendidik dan kependidikan."
        data={data}
        loading={loading}
        onRefresh={loadData}
        onSave={handleSave}
        onDelete={handleDelete}
        defaultDocuments={defaultDocuments}
      />
    </AdminLayout>
  );
}
