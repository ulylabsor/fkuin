import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import AdminDataTable from '../components/AdminDataTable';
import { getDosenSarjana, createDosenSarjana, deleteDosenSarjana, updateDosenSarjana } from '../api/api';

export default function AdminDosenTetap() {
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

  const handleUpdateCatatan = async (id, catatan) => {
    await updateDosenSarjana(id, { catatan });
  };

  return (
    <AdminLayout>
      <AdminDataTable
        title="Dosen Tetap"
        description="Manajemen kelengkapan berkas administrasi dan sertifikasi dosen program sarjana."
        data={data}
        loading={loading}
        onRefresh={loadData}
        onAdd={handleAdd}
        onDelete={handleDelete}
        onUpdateCatatan={handleUpdateCatatan}
        sdmType="dosenTetap"
      />
    </AdminLayout>
  );
}
