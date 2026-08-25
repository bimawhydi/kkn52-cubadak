'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  Upload, Plus, Trash2, LogOut, Image as ImageIcon,
  Newspaper, ArrowLeft, FolderOpen, Layers, Pencil, X, Menu
} from 'lucide-react';

// Motif kecil senada dengan situs publik, dipakai sebagai aksen identitas.
function GonjongMark({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 30" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 27C2 27 4 8 13 3C15.5 1.6 17 4 17 7.5C17 12 22 15 24 15C26 15 31 12 31 7.5C31 4 32.5 1.6 35 3C44 8 46 27 46 27"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<'galeri' | 'berita'>('galeri');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  // --- STATES GALERI ---
  const [editIdGaleri, setEditIdGaleri] = useState<number | null>(null);
  const [titleFoto, setTitleFoto] = useState('');
  const [categoryFoto, setCategoryFoto] = useState('Kegiatan');
  const [filesFoto, setFilesFoto] = useState<File[]>([]);

  // --- STATES BERITA ---
  const [editIdBerita, setEditIdBerita] = useState<number | null>(null);
  const [titleBerita, setTitleBerita] = useState('');
  const [categoryBerita, setCategoryBerita] = useState('Program Utama');
  const [dateBerita, setDateBerita] = useState('');
  const [contentBerita, setContentBerita] = useState('');
  const [fileBerita, setFileBerita] = useState<File | null>(null);

  // --- DATA LISTS ---
  const [galeriList, setGaleriList] = useState<any[]>([]);
  const [beritaList, setBeritaList] = useState<any[]>([]);

  useEffect(() => {
    checkUser();
    loadData();
  }, []);

  // Kunci scroll halaman belakang saat drawer mobile terbuka,
  // dan biarkan tombol Escape ikut menutupnya.
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [sidebarOpen]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.push('/login');
  };

  const loadData = async () => {
    const { data: g } = await supabase.from('galeri').select('*').order('created_at', { ascending: false });
    if (g) setGaleriList(g);

    const { data: b } = await supabase.from('berita').select('*').order('created_at', { ascending: false });
    if (b) setBeritaList(b);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Upload Foto Ke Supabase Storage
  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error } = await supabase.storage.from('kkn-media').upload(filePath, file);
    if (error) throw error;

    const { data } = supabase.storage.from('kkn-media').getPublicUrl(filePath);
    return data.publicUrl;
  };

  // ==========================================
  // LOGIKA CRUD GALERI (CREATE, UPDATE, DELETE)
  // ==========================================

  const resetFormGaleri = () => {
    setEditIdGaleri(null);
    setTitleFoto('');
    setCategoryFoto('Kegiatan');
    setFilesFoto([]);
  };

  const handleEditGaleriClick = (item: any) => {
    setEditIdGaleri(item.id);
    setTitleFoto(item.title);
    setCategoryFoto(item.category);
    setFilesFoto([]); // Kosongkan file, user hanya upload ulang jika ingin ganti foto
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll ke form
  };

  const handleSubmitGaleri = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editIdGaleri && filesFoto.length === 0) return alert('Pilih minimal 1 foto terlebih dahulu');
    setLoading(true);

    try {
      let finalImageUrl = '';

      // Jika ada file baru diunggah (baik saat tambah baru atau edit)
      if (filesFoto.length > 0) {
        const uploadedUrls: string[] = [];
        for (const file of filesFoto) {
          const url = await uploadImage(file);
          uploadedUrls.push(url);
        }
        finalImageUrl = JSON.stringify(uploadedUrls);
      } else {
        // Jika mode Edit tapi tidak ada foto baru diunggah, pertahankan foto lama
        const existingItem = galeriList.find(g => g.id === editIdGaleri);
        finalImageUrl = existingItem.image_url;
      }

      if (editIdGaleri) {
        // UPDATE (EDIT)
        const { error } = await supabase.from('galeri').update({
          title: titleFoto, category: categoryFoto, image_url: finalImageUrl
        }).eq('id', editIdGaleri);
        if (error) throw error;
        alert('Album berhasil diperbarui!');
      } else {
        // CREATE (TAMBAH BARU)
        const { error } = await supabase.from('galeri').insert([{
          title: titleFoto, category: categoryFoto, image_url: finalImageUrl
        }]);
        if (error) throw error;
        alert(`Berhasil mengunggah album baru!`);
      }

      resetFormGaleri();
      loadData();
    } catch (err: any) {
      alert('Gagal memproses data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGaleri = async (id: number) => {
    if (confirm('Yakin ingin menghapus album foto ini? Tindakan ini tidak bisa dibatalkan.')) {
      await supabase.from('galeri').delete().eq('id', id);
      loadData();
    }
  };


  // ==========================================
  // LOGIKA CRUD BERITA (CREATE, UPDATE, DELETE)
  // ==========================================

  const resetFormBerita = () => {
    setEditIdBerita(null);
    setTitleBerita('');
    setCategoryBerita('Program Utama');
    setDateBerita('');
    setContentBerita('');
    setFileBerita(null);
  };

  const handleEditBeritaClick = (item: any) => {
    setEditIdBerita(item.id);
    setTitleBerita(item.title);
    setCategoryBerita(item.category);
    setDateBerita(item.date);
    setContentBerita(item.content);
    setFileBerita(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitBerita = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalImageUrl = '';

      if (fileBerita) {
        finalImageUrl = await uploadImage(fileBerita);
      } else if (editIdBerita) {
        // Jika tidak upload foto baru, ambil foto lama
        const existingItem = beritaList.find(b => b.id === editIdBerita);
        finalImageUrl = existingItem.image_url || '';
      }

      if (editIdBerita) {
        // UPDATE (EDIT)
        const { error } = await supabase.from('berita').update({
          title: titleBerita, category: categoryBerita, date: dateBerita, content: contentBerita, image_url: finalImageUrl
        }).eq('id', editIdBerita);
        if (error) throw error;
        alert('Artikel berhasil diperbarui!');
      } else {
        // CREATE (TAMBAH BARU)
        const { error } = await supabase.from('berita').insert([{
          title: titleBerita, category: categoryBerita, date: dateBerita, content: contentBerita, image_url: finalImageUrl, author: 'Tim KKN 52'
        }]);
        if (error) throw error;
        alert('Artikel berhasil dipublikasikan!');
      }

      resetFormBerita();
      loadData();
    } catch (err: any) {
      alert('Gagal memproses data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBerita = async (id: number) => {
    if (confirm('Yakin ingin menghapus berita ini? Tindakan ini tidak bisa dibatalkan.')) {
      await supabase.from('berita').delete().eq('id', id);
      loadData();
    }
  };

  // Helpers
  const getCoverImage = (urlStr: string) => { try { const p = JSON.parse(urlStr); return Array.isArray(p) ? p[0] : p; } catch { return urlStr; } };
  const getImageCount = (urlStr: string) => { try { const p = JSON.parse(urlStr); return Array.isArray(p) ? p.length : 1; } catch { return 1; } };

  return (
    <div className="min-h-[100dvh] bg-[#F4F1EA] text-[#2C3531] font-ui">

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..800;1,9..144,400..600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .font-display { font-family: 'Fraunces', Georgia, serif; }
        .font-ui { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.25s ease-out; }

        ::selection { background: #D4A373; color: white; }
        :focus-visible { outline: 2px solid #D4A373; outline-offset: 2px; border-radius: 6px; }

        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}} />

      {/* TOPBAR MOBILE — muncul hanya di layar kecil, berisi tombol buka menu */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-[#1A251E] text-white px-4 py-3.5 shadow-lg">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Buka menu navigasi"
          className="p-2 -ml-1 rounded-xl hover:bg-white/10 active:bg-white/15 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <GonjongMark className="w-6 h-4 text-[#D4A373]" />
          <span className="font-display font-bold text-sm tracking-wide">Workspace KKN 52</span>
        </div>
        <div className="w-9" aria-hidden="true" />
      </div>

      {/* BACKDROP — hanya tampil saat drawer mobile terbuka */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 bg-[#1A251E]/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
        />
      )}

      {/* SIDEBAR — drawer di mobile (bisa dibuka/tutup), panel tetap di desktop */}
      <aside
        className={`fixed top-0 left-0 bottom-0 h-[100dvh] w-[280px] bg-[#1A251E] text-[#FAF8F5] z-50 flex flex-col shadow-2xl
        transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="p-7 md:p-8 border-b border-white/10 flex items-start justify-between shrink-0">
          <div>
            <div className="w-11 h-11 bg-[#3D5A45] rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-[#3D5A45]/30 relative">
              <FolderOpen className="w-5 h-5 text-white" />
              <GonjongMark className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-4 text-[#D4A373]" />
            </div>
            <h2 className="font-display text-2xl font-bold tracking-wide">Workspace</h2>
            <p className="text-sm text-gray-400 mt-1 font-light">KKN 52 Cubadak</p>
          </div>
          {/* Tombol tutup — hanya relevan & terlihat di mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup menu navigasi"
            className="lg:hidden -mr-2 -mt-1 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-5 md:p-6 space-y-3 overflow-y-auto min-h-0">
          <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-4 pl-4">Menu Konten</p>
          <button
            onClick={() => { setTab('galeri'); resetFormGaleri(); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 ${
              tab === 'galeri' ? 'bg-[#3D5A45] text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <ImageIcon className="w-5 h-5" /> Manajemen Galeri
          </button>
          <button
            onClick={() => { setTab('berita'); resetFormBerita(); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 ${
              tab === 'berita' ? 'bg-[#3D5A45] text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Newspaper className="w-5 h-5" /> Artikel & Kegiatan
          </button>
        </nav>

        <div className="p-5 md:p-6 pb-8 lg:pb-6 border-t border-white/10 space-y-3 shrink-0">
          <a href="/" className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-all">
            <ArrowLeft className="w-4 h-4" /> Buka Website Publik
          </a>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all">
            <LogOut className="w-4 h-4" /> Keluar Sesi
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="lg:ml-[280px] p-5 sm:p-8 md:p-14">
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-10 md:mb-12">
          <div>
            <span className="text-xs font-bold tracking-widest text-[#3D5A45] uppercase flex items-center gap-2">
              <GonjongMark className="w-3.5 h-2.5" /> Dashboard Admin
            </span>
            <h1 className="text-3xl md:text-4xl font-display text-[#1A251E] mt-2">
              {tab === 'galeri' ? 'Album & Galeri' : 'Kabar & Kegiatan'}
            </h1>
            <p className="text-gray-500 text-sm mt-2 font-light">
              Kelola, tambah, edit, atau hapus {tab === 'galeri' ? 'koleksi foto' : 'artikel kegiatan'} KKN di sini.
            </p>
          </div>
        </header>

        {/* --- KONTEN GALERI --- */}
        {tab === 'galeri' && (
          <div className="grid xl:grid-cols-3 gap-8 md:gap-10">
            {/* Form Input Galeri */}
            <div className={`bg-white p-6 md:p-8 rounded-[2rem] shadow-sm h-fit transition-all duration-500 ${editIdGaleri ? 'border-2 border-[#D4A373]' : 'border border-[#E8E3D9]'}`}>
              <h3 className="font-display text-2xl mb-6 text-[#1A251E] flex items-center gap-2">
                {editIdGaleri ? <Pencil className="w-5 h-5 text-[#D4A373]" /> : <Plus className="w-5 h-5 text-[#3D5A45]" />}
                {editIdGaleri ? 'Edit Album' : 'Buat Album Baru'}
              </h3>
              <form onSubmit={handleSubmitGaleri} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Judul Album / Kegiatan</label>
                  <input type="text" required value={titleFoto} onChange={(e) => setTitleFoto(e.target.value)} placeholder="Contoh: Diskusi dengan Mak Nanun" className="w-full bg-[#FAF8F5] border border-[#E8E3D9] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D5A45]/20 focus:border-[#3D5A45] transition" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Kategori</label>
                  <select value={categoryFoto} onChange={(e) => setCategoryFoto(e.target.value)} className="w-full bg-[#FAF8F5] border border-[#E8E3D9] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D5A45]/20 focus:border-[#3D5A45] transition">
                    <option value="Kegiatan">Kegiatan Harian</option>
                    <option value="Posko">Di Sekitar Posko</option>
                    <option value="Masyarakat">Bersama Warga</option>
                    <option value="Mitra">Mitra (GMS/Sanggar)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    {editIdGaleri ? 'Ganti File (Kosongkan jika tidak diubah)' : 'Pilih File (Bisa Lebih Dari 1)'}
                  </label>
                  <div className="border-2 border-dashed border-[#E8E3D9] bg-[#FAF8F5] rounded-xl px-4 py-7 text-center hover:bg-[#F4F1EA] hover:border-[#D4A373] transition-colors cursor-pointer">
                    <Upload className="w-6 h-6 text-[#D4A373] mx-auto mb-3" />
                    <input type="file" multiple accept="image/*" required={!editIdGaleri} onChange={(e) => setFilesFoto(Array.from(e.target.files || []))} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#3D5A45] file:text-white hover:file:bg-[#1A251E] cursor-pointer" />
                    {filesFoto.length > 0 && <p className="text-xs text-[#3D5A45] font-bold mt-3 bg-[#E0EADF] inline-block px-3 py-1 rounded-full">{filesFoto.length} file dipilih</p>}
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  {editIdGaleri && (
                    <button type="button" onClick={resetFormGaleri} className="w-full bg-gray-100 text-gray-600 py-4 rounded-xl font-medium text-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                      <X className="w-4 h-4"/> Batal
                    </button>
                  )}
                  <button type="submit" disabled={loading} className={`w-full text-white py-4 rounded-xl font-medium text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${editIdGaleri ? 'bg-[#D4A373] hover:bg-[#C88A58]' : 'bg-[#1A251E] hover:bg-[#3D5A45]'}`}>
                    <Upload className="w-4 h-4" /> {loading ? 'Menyimpan...' : (editIdGaleri ? 'Simpan Edit' : 'Unggah Album')}
                  </button>
                </div>
              </form>
            </div>

            {/* List Galeri */}
            <div className="xl:col-span-2 grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 auto-rows-max">
              {galeriList.length === 0 && !loading && (
                <div className="col-span-full text-center py-20 text-gray-400 font-light border-2 border-dashed border-[#E8E3D9] rounded-[2rem]">Belum ada foto. Mulai unggah memori di panel sebelah kiri.</div>
              )}
              {galeriList.map((item) => {
                const imgCount = getImageCount(item.image_url);
                return (
                  <div key={item.id} className={`bg-white rounded-[1.5rem] p-3 border transition-all duration-300 group shadow-sm hover:shadow-xl ${editIdGaleri === item.id ? 'border-[#D4A373] ring-2 ring-[#D4A373]/20' : 'border-[#E8E3D9]'}`}>
                    <div className="relative w-full h-40 rounded-2xl overflow-hidden mb-4 bg-[#F4F1EA]">
                      <img src={getCoverImage(item.image_url)} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />

                      {imgCount > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[9px] px-2 py-1 rounded-md font-bold tracking-widest flex items-center gap-1 z-10"><Layers className="w-3 h-3" /> +{imgCount - 1} FOTO</div>
                      )}

                      {/* Tombol Aksi (Hapus & Edit) */}
                      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-20">
                        <button onClick={() => handleEditGaleriClick(item)} className="bg-white/90 text-blue-500 p-2.5 rounded-xl hover:bg-blue-500 hover:text-white shadow-sm" title="Edit Album" aria-label="Edit Album"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteGaleri(item.id)} className="bg-white/90 text-red-500 p-2.5 rounded-xl hover:bg-red-500 hover:text-white shadow-sm" title="Hapus Album" aria-label="Hapus Album"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="px-2 pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C88A58]">{item.category}</span>
                      <h4 className="font-display text-sm text-[#1A251E] mt-1 line-clamp-1">{item.title}</h4>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- KONTEN BERITA --- */}
        {tab === 'berita' && (
          <div className="grid xl:grid-cols-3 gap-8 md:gap-10">
            {/* Form Input Berita */}
            <div className={`bg-white p-6 md:p-8 rounded-[2rem] shadow-sm h-fit transition-all duration-500 ${editIdBerita ? 'border-2 border-[#D4A373]' : 'border border-[#E8E3D9]'}`}>
              <h3 className="font-display text-2xl mb-6 text-[#1A251E] flex items-center gap-2">
                {editIdBerita ? <Pencil className="w-5 h-5 text-[#D4A373]" /> : <Plus className="w-5 h-5 text-[#3D5A45]" />}
                {editIdBerita ? 'Edit Artikel' : 'Tulis Kabar Baru'}
              </h3>
              <form onSubmit={handleSubmitBerita} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Judul Kabar</label>
                  <input type="text" required value={titleBerita} onChange={(e) => setTitleBerita(e.target.value)} className="w-full bg-[#FAF8F5] border border-[#E8E3D9] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D5A45]/20 focus:border-[#3D5A45]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Tanggal</label>
                    <input type="text" required value={dateBerita} onChange={(e) => setDateBerita(e.target.value)} placeholder="15 Aug 2026" className="w-full bg-[#FAF8F5] border border-[#E8E3D9] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D5A45]/20 focus:border-[#3D5A45]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Kategori</label>
                    <select value={categoryBerita} onChange={(e) => setCategoryBerita(e.target.value)} className="w-full bg-[#FAF8F5] border border-[#E8E3D9] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D5A45]/20 focus:border-[#3D5A45]">
                      <option value="Program Utama">Program Utama</option>
                      <option value="Sosialisasi">Sosialisasi</option>
                      <option value="Seni & Budaya">Seni & Budaya</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Isi Artikel</label>
                  <textarea required rows={5} value={contentBerita} onChange={(e) => setContentBerita(e.target.value)} className="w-full bg-[#FAF8F5] border border-[#E8E3D9] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D5A45]/20 focus:border-[#3D5A45] resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    {editIdBerita ? 'Ganti Cover (Kosongkan jika tidak diubah)' : 'Foto Sampul (Opsional)'}
                  </label>
                  <input type="file" accept="image/*" onChange={(e) => setFileBerita(e.target.files?.[0] || null)} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#3D5A45] file:text-white" />
                </div>

                <div className="flex gap-3 mt-4">
                  {editIdBerita && (
                    <button type="button" onClick={resetFormBerita} className="w-full bg-gray-100 text-gray-600 py-4 rounded-xl font-medium text-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                      <X className="w-4 h-4"/> Batal
                    </button>
                  )}
                  <button type="submit" disabled={loading} className={`w-full text-white py-4 rounded-xl font-medium text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${editIdBerita ? 'bg-[#D4A373] hover:bg-[#C88A58]' : 'bg-[#1A251E] hover:bg-[#3D5A45]'}`}>
                    {loading ? 'Menyimpan...' : (editIdBerita ? 'Simpan Artikel' : 'Terbitkan Artikel')}
                  </button>
                </div>
              </form>
            </div>

            {/* List Berita */}
            <div className="xl:col-span-2 space-y-5 auto-rows-max">
              {beritaList.length === 0 && !loading && (
                <div className="text-center py-20 text-gray-400 font-light border-2 border-dashed border-[#E8E3D9] rounded-[2rem]">Belum ada artikel kegiatan.</div>
              )}
              {beritaList.map((item) => (
                <div key={item.id} className={`bg-white p-5 md:p-6 rounded-[1.5rem] border flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-start group shadow-sm transition-all duration-300 ${editIdBerita === item.id ? 'border-[#D4A373] ring-2 ring-[#D4A373]/20' : 'border-[#E8E3D9] hover:shadow-md'}`}>
                  {item.image_url && <img src={item.image_url} alt={item.title} className="w-full h-40 sm:w-24 sm:h-24 object-cover rounded-xl shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#E0EADF] text-[#3D5A45] px-2 py-1 rounded-md">{item.category}</span>
                      <span className="text-xs text-gray-400">{item.date}</span>
                    </div>
                    <h4 className="font-display text-lg text-[#1A251E] mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2">{item.content}</p>
                  </div>

                  {/* Tombol Aksi Berita */}
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <button onClick={() => handleEditBeritaClick(item)} className="text-gray-400 hover:text-blue-500 bg-gray-50 hover:bg-blue-50 p-3 rounded-xl transition" title="Edit Artikel" aria-label="Edit Artikel">
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDeleteBerita(item.id)} className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-3 rounded-xl transition" title="Hapus Artikel" aria-label="Hapus Artikel">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}