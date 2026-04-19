import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import AdminDataTable from '../components/AdminDataTable';
import { getDosenSarjana, createDosenSarjana, deleteDosenSarjana } from '../api/api';

export default function AdminDosenSarjana() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await getDosenSarjana();
      setData(res.data);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (newPerson) => {
    try {
      await createDosenSarjana(newPerson);
      await loadData();
    } catch (err) {
      console.error('Error adding data:', err);
      alert('Gagal menambahkan data');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDosenSarjana(id);
      await loadData();
    } catch (err) {
      console.error('Error deleting data:', err);
      alert('Gagal menghapus data');
    }
  };

  return (
    <AdminLayout>
      <AdminDataTable
        title="Dosen Sarjana"
        description="Manajemen kelengkapan berkas administrasi dan sertifikasi dosen program sarjana."
        data={data}
        loading={loading}
        onRefresh={loadData}
        onAdd={handleAdd}
        onDelete={handleDelete}
        sdmType="dosenSarjana"
      />
    </AdminLayout>
  );
}
