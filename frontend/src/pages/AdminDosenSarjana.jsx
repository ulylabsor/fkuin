import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import AdminDataTable from '../components/AdminDataTable';
import { getDosenSarjana, createDosenSarjana, updateDosenSarjana, deleteDosenSarjana } from '../api/api';

const defaultDocuments = {
  "KTP": false, "Surat Perjanjian DT": false, "Surat Penugasan Rector": false,
  "Pernyataan EWMP": false, "CV": false, "SIP": false, "STR": false,
  "Sertifikat Pelatihan": false, "Ijazah S1": false, "Ijazah Profesi": false,
  "Ijazah S2": false, "Transkrip S1": false, "Transkrip Profesi": false, "Transkrip S2": false
};

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

  const handleSave = async (id, editData) => {
    try {
      if (id) {
        await updateDosenSarjana(id, editData);
      } else {
        await createDosenSarjana(editData);
      }
      await loadData();
    } catch (err) {
      console.error('Error saving data:', err);
      alert('Gagal menyimpan data');
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
        onSave={handleSave}
        onDelete={handleDelete}
        defaultDocuments={defaultDocuments}
      />
    </AdminLayout>
  );
}
