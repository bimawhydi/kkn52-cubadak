'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  MapPin, Heart, Users, Image as ImageIcon,
  ArrowUpRight, X, Calendar, Lock, ArrowDown, ArrowRight,
  Mail, ChevronLeft, ChevronRight, Layers, ArrowLeft, BookOpen
} from 'lucide-react';

interface FotoItem { id: number; title: string; category: string; image_url: string; }
interface BeritaItem { id: number; title: string; category: string; date: string; content: string; image_url: string; author: string; }

// HELPER: Mengubah teks JSON dari database menjadi array foto
const parseImages = (urlStr: string): string[] => {
  try {
    const parsed = JSON.parse(urlStr);
    return Array.isArray(parsed) ? parsed : [urlStr];
  } catch {
    return [urlStr];
  }
};

// SIGNATURE MOTIF — garis atap gonjong Rumah Gadang, dipakai berulang
// sebagai penanda visual khas Nagari Cubadak / Tanah Datar.
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

function GonjongSkyline({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 160" preserveAspectRatio="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        fill="currentColor"
        d="M0,140 C0,140 22,58 62,38 C92,23 112,68 152,88 C192,108 212,58 252,38 C282,23 302,68 342,88 C382,108 402,58 442,38 C472,23 492,68 532,88 C572,108 592,58 632,38 C662,23 682,68 722,88 C762,108 782,58 822,38 C852,23 872,68 912,88 C952,108 972,58 1012,38 C1042,23 1062,68 1102,88 C1142,108 1160,86 1200,140 L1200,160 L0,160 Z"
      />
    </svg>
  );
}

export default function Home() {
  const [galeri, setGaleri] = useState<FotoItem[]>([]);
  const [berita, setBerita] = useState<BeritaItem[]>([]);
  const [kategoriAktif, setKategoriAktif] = useState<string>('Semua');
  const [loading, setLoading] = useState<boolean>(true);
  const [scrolled, setScrolled] = useState(false);

  // STATES UNTUK ALBUM GALERI
  const [selectedAlbum, setSelectedAlbum] = useState<FotoItem | null>(null);
  const [albumImages, setAlbumImages] = useState<string[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // STATES UNTUK BERITA & SLIDER
  const [selectedBerita, setSelectedBerita] = useState<BeritaItem | null>(null);
  const [featuredIndex, setFeaturedIndex] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    const { data: dataGaleri } = await supabase.from('galeri').select('*').order('created_at', { ascending: false });
    if (dataGaleri) setGaleri(dataGaleri);

    const { data: dataBerita } = await supabase.from('berita').select('*').order('created_at', { ascending: false });
    if (dataBerita) setBerita(dataBerita);
    setLoading(false);
  };

  // PERBAIKAN 1: Jalankan fetchData hanya 1 kali saat halaman diload
  useEffect(() => {
    fetchData();
  }, []);

  // PERBAIKAN 2: Jalankan Observer HANYA setelah loading selesai
  useEffect(() => {
    if (loading) return; // Jangan jalankan observer jika data belum dirender

    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    // Beri jeda sedikit agar React selesai merender elemen DOM baru dari database
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      }, { threshold: 0.1 });

      const hiddenElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
      hiddenElements.forEach((el) => observer.observe(el));
    }, 100);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, [loading]);

  // EFEK AUTO-SLIDER UNTUK BERITA (Setiap 4 Detik)
  useEffect(() => {
    if (berita.length === 0) return;
    const interval = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % Math.min(berita.length, 3)); // Maksimal 3 berita utama
    }, 4000);
    return () => clearInterval(interval);
  }, [berita]);

  const filteredGaleri = kategoriAktif === 'Semua'
    ? galeri
    : galeri.filter(item => item.category.toLowerCase() === kategoriAktif.toLowerCase());

  // FUNGSI GALERI
  const openAlbum = (album: FotoItem) => {
    const images = parseImages(album.image_url);
    setSelectedAlbum(album);
    setAlbumImages(images);
    setCurrentSlideIndex(0);
  };
  const nextSlide = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentSlideIndex((prev) => (prev === albumImages.length - 1 ? 0 : prev + 1));
  }, [albumImages]);
  const prevSlide = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentSlideIndex((prev) => (prev === 0 ? albumImages.length - 1 : prev - 1));
  }, [albumImages]);

  // EFEK KEYBOARD GALERI & BERITA
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedAlbum) {
        if (e.key === 'ArrowRight') nextSlide();
        if (e.key === 'ArrowLeft') prevSlide();
        if (e.key === 'Escape') setSelectedAlbum(null);
      }
      if (selectedBerita && e.key === 'Escape') {
        setSelectedBerita(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAlbum, nextSlide, prevSlide, selectedBerita]);

  // Data Berita Utama (Top 3)
  const featuredBerita = berita.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#1A251E] font-ui overflow-x-hidden selection:bg-[#D4A373] selection:text-white">

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .font-display { font-family: 'Fraunces', Georgia, serif; }
        .font-ui { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; }

        .reveal { opacity: 0; transform: translateY(60px); transition: all 1s cubic-bezier(0.16, 1, 0.3, 1); }
        .reveal-left { opacity: 0; transform: translateX(-60px); transition: all 1s cubic-bezier(0.16, 1, 0.3, 1); }
        .reveal-right { opacity: 0; transform: translateX(60px); transition: all 1s cubic-bezier(0.16, 1, 0.3, 1); }
        .visible { opacity: 1 !important; transform: translate(0) scale(1) !important; }

        .delay-100 { transition-delay: 100ms; }
        .delay-200 { transition-delay: 200ms; }
        .delay-300 { transition-delay: 300ms; }

        @keyframes float { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(2deg); } }
        .animate-float { animation: float 7s ease-in-out infinite; }
        .animate-float-slow { animation: float 10s ease-in-out infinite reverse; }

        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-ticker { animation: ticker 28s linear infinite; display: flex; width: max-content; }
        .animate-ticker:hover { animation-play-state: paused; }

        @keyframes popup { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-popup { animation: popup 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        /* Animasi overlay artikel agar mulus */
        @keyframes slideUp { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }

        @keyframes fillBar { from { width: 0%; } to { width: 100%; } }
        .progress-fill { animation: fillBar 4s linear forwards; }

        ::selection { background: #D4A373; color: white; }
        :focus-visible { outline: 2px solid #D4A373; outline-offset: 3px; border-radius: 4px; }

        @media (prefers-reduced-motion: reduce) {
          .reveal, .reveal-left, .reveal-right { transition: none !important; opacity: 1 !important; transform: none !important; }
          .animate-float, .animate-float-slow, .animate-ticker, .animate-popup, .animate-slide-up, .animate-fade-in, .progress-fill { animation: none !important; }
        }
      `}} />

      {/* NAVBAR */}
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${scrolled ? 'bg-[#F4F1EA]/85 backdrop-blur-xl border-b border-[#E8E3D9] py-3' : 'bg-transparent py-5 md:py-6'}`}>
        <div className="w-full flex justify-between items-center px-4 sm:px-6 md:px-8 2xl:px-12">

          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img
              src="/images/logo-kkn.jpeg"
              alt="Logo KKN 52"
              className="w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-[#D4A373] shadow-md group-hover:scale-105 group-hover:rotate-6 transition-all duration-300 object-cover bg-[#1A251E]"
              onError={(e) => e.currentTarget.style.display = 'none'}
            />
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="font-display font-bold text-base md:text-lg tracking-wide group-hover:text-[#D4A373] transition-colors">KKN 52 UINIB</span>
              <span className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-gray-400 font-semibold">Cubadak</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-10 text-[11px] uppercase tracking-[0.22em] font-bold text-gray-500">
            <a href="#posko" className="relative py-1 hover:text-[#1A251E] transition-colors group/nav">Posko<span className="absolute left-0 -bottom-0.5 w-0 h-[1.5px] bg-[#D4A373] group-hover/nav:w-full transition-all duration-300"></span></a>
            <a href="#mitra" className="relative py-1 hover:text-[#1A251E] transition-colors group/nav">Mitra<span className="absolute left-0 -bottom-0.5 w-0 h-[1.5px] bg-[#D4A373] group-hover/nav:w-full transition-all duration-300"></span></a>
            <a href="#berita" className="relative py-1 hover:text-[#1A251E] transition-colors group/nav">Kabar<span className="absolute left-0 -bottom-0.5 w-0 h-[1.5px] bg-[#D4A373] group-hover/nav:w-full transition-all duration-300"></span></a>
            <a href="#galeri" className="relative py-1 hover:text-[#1A251E] transition-colors group/nav">Galeri<span className="absolute left-0 -bottom-0.5 w-0 h-[1.5px] bg-[#D4A373] group-hover/nav:w-full transition-all duration-300"></span></a>
          </div>

          <a href="/login" className="flex items-center gap-2 bg-[#1A251E] text-white px-5 py-2.5 md:px-6 md:py-3 rounded-full text-[11px] font-bold tracking-widest hover:bg-[#D4A373] hover:text-[#1A251E] hover:scale-105 transition-all duration-300 shadow-lg shadow-black/10 shrink-0">
            <Lock className="w-3.5 h-3.5" /> <span className="hidden xs:inline">ADMIN</span>
          </a>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-screen w-full flex flex-col items-center justify-center pt-24 overflow-hidden">
        <div className="absolute top-1/4 left-10 md:left-32 w-64 h-64 bg-[#E8E4D8] rounded-full blur-[80px] animate-float -z-10"></div>
        <div className="absolute bottom-1/4 right-10 md:right-32 w-96 h-96 bg-[#D4A373]/20 rounded-full blur-[100px] animate-float-slow -z-10"></div>
        <GonjongSkyline className="absolute bottom-0 left-0 w-full h-36 md:h-52 text-[#1A251E]/[0.045] -z-10" />

        <div className="w-full max-w-[1800px] mx-auto px-6 md:px-12 xl:px-24 relative z-10 flex flex-col items-center text-center">
          <div className="reveal flex items-center gap-2.5 bg-white/60 backdrop-blur-md border border-[#E8E3D9] pl-3.5 pr-5 py-2 rounded-full text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase mb-10 text-[#B9814F] shadow-sm">
            <GonjongMark className="w-4 h-4 text-[#D4A373]" />
            <MapPin className="w-3.5 h-3.5" /> Jorong Supanjang, Nagari Cubadak
          </div>
          <h1 className="reveal delay-100 flex flex-col items-center justify-center text-5xl md:text-8xl 2xl:text-[9.5rem] font-display leading-[0.92] tracking-tight mb-8">
            <span className="block italic font-light text-gray-400 mb-1 md:mb-2">Arsip Jejak</span>
            <span className="block font-black text-[#1A251E] uppercase tracking-tighter">Pengabdian</span>
            <span className="block flex items-center gap-4 md:gap-8 mt-2">
              <span className="h-[2px] w-10 md:w-28 bg-[#D4A373] hidden md:block"></span>
              <span className="italic font-light text-[#2C4233]">& Kenangan</span>
              <span className="h-[2px] w-10 md:w-28 bg-[#D4A373] hidden md:block"></span>
            </span>
          </h1>
          <p className="reveal delay-200 max-w-2xl text-lg md:text-xl text-gray-500 font-light leading-relaxed mb-14">
            Merangkum setiap tawa, kerja keras, dan kehangatan keluarga baru di Nagari Cubadak. KKN Reguler 52 UIN Imam Bonjol Padang.
          </p>
          <div className="reveal delay-300 flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
            <a href="#galeri" className="group flex items-center gap-4 bg-[#1A251E] text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-[#D4A373] hover:text-[#1A251E] transition-all duration-500 shadow-xl shadow-black/10">
              Mulai Menjelajah
              <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
            </a>
            <a href="#berita" className="flex items-center gap-2 text-[#1A251E]/60 hover:text-[#1A251E] px-6 py-4 font-bold text-sm uppercase tracking-widest transition-colors">
              Baca Kabar Terbaru
            </a>
          </div>
        </div>
      </section>

      {/* TICKER STATISTIK */}
      <section className="w-full bg-[#1A251E] text-[#F4F1EA] py-8 border-y border-white/10 overflow-hidden">
        <div className="animate-ticker">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center whitespace-nowrap px-8">
              <span className="text-4xl font-display italic mr-4">30</span> <span className="text-sm font-bold tracking-[0.2em] uppercase mr-8 text-[#D4A373]">Hari Pengabdian</span>
              <GonjongMark className="w-5 h-3.5 text-white/20 mr-8" />
              <span className="text-4xl font-display italic mr-4">2</span> <span className="text-sm font-bold tracking-[0.2em] uppercase mr-8 text-[#D4A373]">Posko Utama</span>
              <GonjongMark className="w-5 h-3.5 text-white/20 mr-8" />
              <span className="text-4xl font-display italic mr-4">2</span> <span className="text-sm font-bold tracking-[0.2em] uppercase mr-8 text-[#D4A373]">Mitra Kolaborasi</span>
              <GonjongMark className="w-5 h-3.5 text-white/20 mr-8" />
              <span className="text-4xl font-display italic mr-4">Abadi</span> <span className="text-sm font-bold tracking-[0.2em] uppercase mr-12 text-[#D4A373]">Memori Terekam</span>
            </div>
          ))}
        </div>
      </section>

      {/* CERITA POSKO */}
      <section id="posko" className="py-28 md:py-36 w-full max-w-[1800px] mx-auto px-6 md:px-12 xl:px-24">
        <div className="reveal text-center max-w-3xl mx-auto mb-20 md:mb-24">
          <span className="text-xs font-bold tracking-[0.25em] text-[#D4A373] uppercase flex items-center justify-center gap-2 mb-4">
            <GonjongMark className="w-4 h-4" /> Tempat Berpulang
          </span>
          <h2 className="text-5xl md:text-7xl font-display text-[#1A251E] leading-tight">Dua Atap, <br/><span className="italic text-gray-400">Satu Keluarga.</span></h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          <div className="reveal-left bg-white p-8 md:p-12 rounded-[2rem] border border-[#E8E3D9] shadow-xl relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#F4F1EA] rounded-full group-hover:scale-150 transition-transform duration-700 ease-out z-0"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-[#1A251E] rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg group-hover:-translate-y-2 transition-transform relative">
                <Users className="w-8 h-8" />
                <GonjongMark className="absolute -top-4 left-1/2 -translate-x-1/2 w-9 h-5 text-[#D4A373]" />
              </div>
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#D4A373] block mb-2">Posko Laki-Laki</span>
              <h3 className="text-4xl font-display text-[#1A251E] mb-6">Rumah Mak Nanun</h3>
              <p className="text-gray-500 font-light text-lg leading-relaxed">
                Markas utama penyusunan program kerja, meja diskusi hangat malam hari, dan tempat berkumpulnya pemuda jorong serta rekan-rekan.
              </p>
            </div>
          </div>

          <div className="reveal-right bg-[#2C4233] text-[#F4F1EA] p-8 md:p-12 rounded-[2rem] shadow-2xl relative overflow-hidden group lg:mt-32">
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#1A251E] rounded-full group-hover:scale-150 transition-transform duration-700 ease-out z-0"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-[#D4A373] rounded-2xl flex items-center justify-center text-[#1A251E] mb-8 shadow-lg group-hover:-translate-y-2 transition-transform relative">
                <Heart className="w-8 h-8" />
                <GonjongMark className="absolute -top-4 left-1/2 -translate-x-1/2 w-9 h-5 text-white" />
              </div>
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/50 block mb-2">Posko Perempuan</span>
              <h3 className="text-4xl font-display mb-6 text-white">Rumah Buk Sandra</h3>
              <p className="text-white/70 font-light text-lg leading-relaxed">
                Pusat kehangatan sesungguhnya. Dapur andalan untuk konsumsi bersama, serta ruang bercengkerama yang merawat tawa usai pengabdian.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MITRA KOLABORASI */}
      <section id="mitra" className="py-24 bg-[#D4A373] overflow-hidden text-[#1A251E] relative">
        <div className="w-full max-w-[1800px] mx-auto px-6 md:px-12 xl:px-24 mb-10 text-center relative z-10">
           <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-[#1A251E]/70 mb-4">Mitra Kolaborasi Hebat Kami</h2>
        </div>

        <div className="animate-ticker py-6 relative z-10">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center whitespace-nowrap px-10 gap-12 md:gap-20">
              <div className="flex items-center gap-6 md:gap-8 bg-[#1A251E] px-8 py-4 rounded-full shadow-lg">
                <img
                  src="/images/logo-sanggar.jpeg"
                  alt="Sanggar Seni 2 Limbago"
                  className="h-16 w-16 md:h-20 md:w-20 object-cover rounded-full border-2 border-[#D4A373]"
                  onError={(e) => e.currentTarget.style.display = 'none'}
                />
                <span className="text-3xl md:text-5xl font-display font-bold text-white tracking-wide">Sanggar Seni 2 Limbago</span>
              </div>
              <span className="text-5xl font-display italic font-light text-[#1A251E]/40">&</span>
              <div className="flex items-center gap-6 md:gap-8 bg-white px-8 py-4 rounded-full shadow-lg">
                <img
                  src="/images/logo-gms.jpeg"
                  alt="GMS"
                  className="h-16 w-16 md:h-20 md:w-20 object-cover rounded-full border-2 border-gray-200"
                  onError={(e) => e.currentTarget.style.display = 'none'}
                />
                <span className="text-3xl md:text-5xl font-display font-bold text-[#1A251E] tracking-wide">GMS (Generasi Muda Supanjang)</span>
              </div>
              <span className="text-5xl font-display italic font-light text-[#1A251E]/40">&</span>
            </div>
          ))}
        </div>
      </section>

      {/* BERITA & KEGIATAN */}
      <section id="berita" className="py-28 md:py-36 w-full max-w-[1800px] mx-auto px-6 md:px-12 xl:px-24">

        <div className="reveal flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-2xl">
            <span className="text-xs font-bold tracking-[0.25em] text-[#D4A373] uppercase flex items-center gap-2 mb-4">
              <GonjongMark className="w-4 h-4" /> Catatan Perjalanan
            </span>
            <h2 className="text-5xl md:text-6xl font-display text-[#1A251E]">Kabar Kegiatan</h2>
          </div>
          <p className="text-gray-500 font-light text-lg max-w-md md:text-right">
            Catatan perjalanan, progres program kerja, dan dinamika KKN 52.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 font-light">Membaca arsip...</div>
        ) : berita.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-[#E8E3D9] text-gray-400 font-light">
            Belum ada catatan berita. Tambahkan melalui Panel Admin.
          </div>
        ) : (
          <>
            {/* 1. FEATURED AUTO-SLIDER (BERITA UTAMA) */}
            {featuredBerita.length > 0 && (
              <div className="reveal relative w-full h-[450px] md:h-[550px] rounded-[2rem] md:rounded-[3rem] overflow-hidden mb-12 shadow-2xl group cursor-pointer"
                   onClick={() => setSelectedBerita(featuredBerita[featuredIndex])}>

                {featuredBerita.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === featuredIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                  >
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80'}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[20s] ease-out bg-[#E8E3D9]"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A251E] via-[#1A251E]/50 to-transparent"></div>

                    {/* Konten Slider */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 flex flex-col md:flex-row justify-between items-end gap-6">
                      <div className="max-w-3xl">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="bg-[#D4A373] text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">{item.category}</span>
                          <span className="text-white/70 text-sm flex items-center gap-1.5"><Calendar className="w-4 h-4"/> {item.date}</span>
                        </div>
                        <h3 className="text-3xl md:text-5xl lg:text-6xl font-display text-white leading-tight mb-4 group-hover:text-[#D4A373] transition-colors duration-300">
                          {item.title}
                        </h3>
                        <p className="text-white/70 font-light text-sm md:text-base line-clamp-2 md:line-clamp-1">
                          {item.content}
                        </p>
                      </div>

                      {/* Tombol Baca */}
                      <button className="hidden md:flex shrink-0 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white hover:text-[#1A251E] text-white px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 items-center gap-3">
                        <BookOpen className="w-4 h-4" /> Baca Artikel
                      </button>
                    </div>
                  </div>
                ))}

                {/* Indikator Titik + Progress (Dots) */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                  {featuredBerita.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full overflow-hidden transition-all duration-500 ${idx === featuredIndex ? 'w-10 bg-white/25' : 'w-2 bg-white/40'}`}
                    >
                      {idx === featuredIndex && <div key={featuredIndex} className="h-full bg-[#D4A373] progress-fill"></div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. GRID LIST BERITA LAINNYA */}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
              {berita.map((item, idx) => (
                <article
                  key={item.id}
                  onClick={() => setSelectedBerita(item)}
                  className={`reveal delay-${(idx % 3) * 100} group cursor-pointer bg-white rounded-[2rem] p-4 border border-[#E8E3D9] shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 flex flex-col h-full`}
                >
                  <div className="w-full h-60 rounded-[1.5rem] overflow-hidden mb-6 relative bg-[#E8E3D9]">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-110 transition duration-700 ease-in-out" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon className="w-10 h-10"/></div>
                    )}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#1A251E]">
                      {item.category}
                    </div>
                  </div>
                  <div className="px-3 flex-1 flex flex-col">
                    <span className="text-xs text-gray-400 flex items-center gap-2 mb-3 font-medium"><Calendar className="w-3.5 h-3.5"/> {item.date}</span>
                    <h3 className="font-display text-2xl text-[#1A251E] mb-3 leading-snug group-hover:text-[#D4A373] transition-colors">{item.title}</h3>
                    <p className="text-gray-500 text-sm font-light line-clamp-3 mb-6 flex-1">{item.content}</p>
                    <div className="flex items-center text-[#1A251E] text-xs font-bold uppercase tracking-widest gap-2 pb-2">
                      Baca Selengkapnya <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {/* GALERI */}
      <section id="galeri" className="py-28 md:py-36 bg-white border-t border-[#E8E3D9] w-full relative overflow-hidden">
        <GonjongSkyline className="absolute top-0 left-0 w-full h-24 md:h-32 text-[#1A251E]/[0.03] rotate-180" />
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 xl:px-24 relative z-10">
          <div className="reveal text-center mb-16">
            <span className="text-xs font-bold tracking-[0.25em] text-[#D4A373] uppercase flex items-center justify-center gap-2 mb-4">
              <GonjongMark className="w-4 h-4" /> Sudut Kenangan
            </span>
            <h2 className="text-5xl md:text-7xl font-display text-[#1A251E] mb-6">Galeri Memori</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {['Semua', 'Kegiatan', 'Posko', 'Masyarakat', 'Mitra'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setKategoriAktif(cat)}
                  className={`px-6 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase transition-all duration-300 ${
                    kategoriAktif.toLowerCase() === cat.toLowerCase()
                      ? 'bg-[#1A251E] text-white'
                      : 'bg-[#F4F1EA] text-gray-500 hover:bg-[#D4A373] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
             <div className="text-center py-20 text-gray-400 font-light">Memuat galeri foto...</div>
          ) : filteredGaleri.length === 0 ? (
             <div className="text-center py-20 bg-[#F4F1EA] rounded-[2rem] text-gray-400 font-light max-w-2xl mx-auto">
               Belum ada foto.
             </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-6 space-y-6 group/gallery">
              {filteredGaleri.map((album, idx) => {
                const images = parseImages(album.image_url);
                const coverImage = images[0];

                return (
                  // PERBAIKAN 3: Memberikan bg color dan min-height (agar tidak terjadi layout shift) pada wrapper galeri
                  <div
                    key={album.id}
                    onClick={() => openAlbum(album)}
                    className={`reveal delay-${(idx % 4) * 100} break-inside-avoid relative rounded-[2rem] overflow-hidden cursor-pointer group/item transition-all duration-500 hover:!opacity-100 group-hover/gallery:opacity-50 bg-[#E8E3D9] min-h-[250px]`}
                  >
                    <img 
                      src={coverImage} 
                      alt={album.title} 
                      className="w-full h-full object-cover transform group-hover/item:scale-110 transition duration-700 ease-out" 
                      loading="lazy" 
                      decoding="async"
                    />
                    {images.length > 1 && (
                      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white text-[10px] px-3 py-1.5 rounded-full font-bold tracking-widest flex items-center gap-1.5 z-10 shadow-lg">
                        <Layers className="w-3.5 h-3.5 text-[#D4A373]" /> {images.length} FOTO
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover/item:opacity-100 transition-all duration-500 p-8 flex flex-col justify-end text-white">
                      <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#D4A373] mb-2">{album.category}</span>
                      <h4 className="font-display text-xl leading-snug">{album.title}</h4>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* --- OVERLAY BACA ARTIKEL (READING MODE) --- */}
      {selectedBerita && (
        <div className="fixed inset-0 z-[200] bg-[#F4F1EA] overflow-y-auto animate-slide-up">

          {/* Header Tombol Kembali */}
          <div className="sticky top-0 z-50 bg-[#F4F1EA]/90 backdrop-blur-md border-b border-[#E8E3D9] px-6 py-4 flex justify-between items-center">
            <button
              onClick={() => setSelectedBerita(null)}
              className="flex items-center gap-3 bg-white border border-[#E8E3D9] px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest text-[#1A251E] hover:bg-[#1A251E] hover:text-white transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali
            </button>
            <div className="font-display font-bold text-[#1A251E] tracking-widest">KKN 52 UINIB CUBADAK</div>
          </div>

          <div className="max-w-4xl mx-auto bg-white min-h-screen shadow-2xl relative pb-32">

            {/* Foto Cover Artikel */}
            <div className="w-full h-[40vh] md:h-[60vh] bg-[#E8E3D9] relative">
              <img
                src={selectedBerita.image_url || 'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80'}
                alt={selectedBerita.title}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>

            {/* Konten Artikel */}
            <div className="px-8 md:px-16 py-12 md:py-20 -mt-16 relative z-10 bg-white rounded-t-[3rem]">

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <span className="bg-[#EAE5D9] text-[#D4A373] px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  {selectedBerita.category}
                </span>
                <span className="text-sm font-semibold text-gray-400 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4"/> {selectedBerita.date}
                </span>
              </div>

              {/* Judul */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display text-[#1A251E] leading-[1.1] mb-8">
                {selectedBerita.title}
              </h1>

              {/* Pemisah Author */}
              <div className="flex items-center gap-4 border-y border-[#E8E3D9] py-6 mb-12">
                <div className="w-12 h-12 bg-[#1A251E] text-white rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Ditulis Oleh</p>
                  <p className="text-sm font-semibold text-[#1A251E]">{selectedBerita.author || 'Tim KKN 52'}</p>
                </div>
              </div>

              {/* Paragraf Artikel */}
              <div className="prose prose-lg max-w-none text-gray-600 font-light leading-relaxed">
                {selectedBerita.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-6">{paragraph}</p>
                ))}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL GALERI */}
      {selectedAlbum && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <div className="absolute inset-0 bg-[#1A251E]/80 backdrop-blur-md cursor-pointer" onClick={() => setSelectedAlbum(null)}></div>
          {albumImages.length > 1 && (
            <button onClick={prevSlide} className="absolute left-4 md:left-10 bg-white/10 hover:bg-white/30 text-white p-3 md:p-4 rounded-full backdrop-blur-md transition-all duration-300 z-20 hover:scale-110">
              <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
            </button>
          )}
          <div className="relative bg-white rounded-[2rem] p-4 md:p-6 w-full max-w-4xl shadow-2xl z-10 animate-popup flex flex-col max-h-full">
            <button onClick={() => setSelectedAlbum(null)} className="absolute -top-4 -right-4 md:-top-5 md:-right-5 bg-white text-[#1A251E] hover:bg-red-500 hover:text-white p-3 rounded-full shadow-xl transition-all duration-300 z-30"><X className="w-6 h-6" /></button>
            <div className="bg-[#1A251E] rounded-[1.5rem] overflow-hidden flex items-center justify-center relative flex-1 min-h-[30vh] md:min-h-[50vh] max-h-[65vh]">
              <img key={currentSlideIndex} src={albumImages[currentSlideIndex]} alt={`${selectedAlbum.title} - ${currentSlideIndex + 1}`} className="w-full h-full object-contain animate-fade-in" />
            </div>
            <div className="mt-6 px-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="inline-block px-3 py-1 bg-[#F4F1EA] text-[#D4A373] rounded-full text-[10px] uppercase font-bold tracking-widest">{selectedAlbum.category}</span>
                  {albumImages.length > 1 && <span className="text-xs font-bold tracking-widest text-gray-400">FOTO {currentSlideIndex + 1} / {albumImages.length}</span>}
                </div>
                <h3 className="text-2xl md:text-3xl font-display text-[#1A251E] pr-4">{selectedAlbum.title}</h3>
              </div>
              <a href={albumImages[currentSlideIndex]} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-2 px-6 py-3 border-2 border-[#1A251E] text-[#1A251E] hover:bg-[#1A251E] hover:text-white rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300">Resolusi Penuh <ArrowUpRight className="w-4 h-4" /></a>
            </div>
          </div>
          {albumImages.length > 1 && (
            <button onClick={nextSlide} className="absolute right-4 md:right-10 bg-white/10 hover:bg-white/30 text-white p-3 md:p-4 rounded-full backdrop-blur-md transition-all duration-300 z-20 hover:scale-110">
              <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
            </button>
          )}
        </div>
      )}

      {/* FOOTER */}
      <footer className="py-24 bg-[#1A251E] text-white relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#2C4233] rounded-full blur-[100px] opacity-40 z-0"></div>
        <GonjongSkyline className="absolute top-0 left-0 w-full h-20 md:h-28 text-white/[0.04]" />
        <div className="w-full max-w-[1800px] mx-auto px-6 md:px-12 xl:px-24 relative z-10 flex flex-col md:flex-row justify-between items-center md:items-start gap-16">
          <div className="text-center md:text-left flex flex-col items-center md:items-start">
            <img src="/images/logo-kkn.jpeg" alt="Logo KKN" className="w-24 h-24 mb-6 rounded-2xl shadow-2xl border-2 border-white/10 bg-black object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
            <h2 className="font-display text-4xl mb-3">KKN 52 UINIB CUBADAK</h2>
            <p className="text-sm font-light text-white/60 max-w-sm">Jorong Supanjang, Nagari Cubadak, Kec. Limo Kaum, Kab. Tanah Datar, Sumatera Barat.</p>
          </div>
          <div className="flex flex-col items-center gap-4 pt-4">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#D4A373]">Hubungi & Ikuti Kami</span>
            <div className="flex items-center gap-4">
              <a href="mailto:kkn52uinibcubadak@gmail.com" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#D4A373] hover:text-[#1A251E] text-white hover:scale-110 transition-all duration-300" title="Email"><Mail className="w-5 h-5" /></a>
              <a href="https://instagram.com/kkn52_uinib_cubadak" target="_blank" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#D4A373] hover:text-[#1A251E] text-white hover:scale-110 transition-all duration-300" title="Instagram"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>
              <a href="https://tiktok.com/@kkn52_uinib_cubadak" target="_blank" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#D4A373] hover:text-[#1A251E] text-white hover:scale-110 transition-all duration-300" title="TikTok"><svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg></a>
            </div>
            <p className="text-xs text-white/50 tracking-wider">@kkn52_uinib_cubadak</p>
          </div>
          <div className="text-center md:text-right text-xs font-light text-white/50 pt-4 md:pt-14">
            <p>© 2026 Mahasiswa KKN 52 UINIB CUBADAK.</p>
            <p className="mt-1">Dibuat dengan ❤️ untuk kenangan abadi.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}