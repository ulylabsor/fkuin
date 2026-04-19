import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import AdminDataTable from '../components/AdminDataTable';
import { getPembimbingKlinik, createPembimbingKlinik, deletePembimbingKlinik } from '../api/api';

export default function AdminPembimbingKlinik() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await getPembimbingKlinik();
      setData(res.data);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (newPerson) => {
    try {
      await createPembimbingKlinik(newPerson);
      await loadData();
    } catch (err) {
      console.error('Error adding data:', err);
      alert('Gagal menambahkan data');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePembimbingKlinik(id);
      await loadData();
    } catch (err) {
      console.error('Error deleting data:', err);
      alert('Gagal menghapus data');
    }
  };

  return (
    <AdminLayout>
      <AdminDataTable
        title="Pembimbing Klinik"
        description="Manajemen kelengkapan berkas administrasi dan sertifikasi pembimbing klinik."
        data={data}
        loading={loading}
        onRefresh={loadData}
        onAdd={handleAdd}
        onDelete={handleDelete}
        sdmType="pembimbingKlinik"
      />
    </AdminLayout>
  );
}
