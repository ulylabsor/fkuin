import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import AdminDataTable from '../components/AdminDataTable';
import { getPembimbingKlinik, createPembimbingKlinik, updatePembimbingKlinik, deletePembimbingKlinik } from '../api/api';

const defaultDocuments = {
  "KTP": false, "Surat Penugasan": false, "CV": false, "STR": false,
  "SIP": false, "Ijazah Spesialis": false, "Serkam": false,
  "Ijazah (S1-S2)": false, "Transkrip": false
};

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

  const handleSave = async (id, editData) => {
    try {
      if (id) {
        await updatePembimbingKlinik(id, editData);
      } else {
        await createPembimbingKlinik(editData);
      }
      await loadData();
    } catch (err) {
      console.error('Error saving data:', err);
      alert('Gagal menyimpan data');
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
        onSave={handleSave}
        onDelete={handleDelete}
        defaultDocuments={defaultDocuments}
      />
    </AdminLayout>
  );
}
