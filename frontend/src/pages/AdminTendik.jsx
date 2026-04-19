import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import AdminDataTable from '../components/AdminDataTable';
import { getTendik, createTendik, deleteTendik, updateTendik } from '../api/api';

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

  const handleAdd = async (newPerson) => {
    try {
      await createTendik(newPerson);
      await loadData();
    } catch (err) {
      console.error('Error adding data:', err);
      alert('Gagal menambahkan data');
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

  const handleUpdateCatatan = async (id, catatan) => {
    await updateTendik(id, { catatan });
  };

  return (
    <AdminLayout>
      <AdminDataTable
        title="Tendik & Laboran"
        description="Manajemen kelengkapan berkas administrasi dan sertifikasi tenaga pendidik dan kependidikan."
        data={data}
        loading={loading}
        onRefresh={loadData}
        onAdd={handleAdd}
        onDelete={handleDelete}
        onUpdateCatatan={handleUpdateCatatan}
        sdmType="tendik"
      />
    </AdminLayout>
  );
}
