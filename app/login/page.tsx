'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Key, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Akses ditolak. Periksa kembali email dan kata sandi Anda.');
      setLoading(false);
    } else {
      router.push('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-[#D4A373] selection:text-white">
      
      {/* Ornamen Cahaya Latar Belakang (Melayang) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#D4A373]/20 rounded-full blur-[80px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#1A251E]/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Kartu Form Login Berpola Glassmorphism */}
      <div className="max-w-md w-full bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-12 border border-white shadow-2xl relative z-10">
        
        <a href="/" className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 hover:text-[#D4A373] mb-10 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </a>

        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#1A251E] text-[#D4A373] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#1A251E]/20 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-3xl font-serif text-[#1A251E] mb-2">Akses Admin</h2>
          <p className="text-sm font-light text-gray-500">Masuk untuk mengelola arsip KKN 52.</p>
        </div>

        {/* Notifikasi Error */}
        {error && (
          <div className="bg-red-50 text-red-600 text-xs font-medium p-4 rounded-2xl mb-8 border border-red-100 flex items-center gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          
          {/* Input Email */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A251E]/70 mb-2 pl-1">Email Admin</label>
            <div className="relative group">
              <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-3.5 group-focus-within:text-[#D4A373] transition-colors" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kkn52.com"
                className="w-full bg-white border-2 border-[#E8E3D9] rounded-2xl pl-12 pr-4 py-3.5 text-sm text-[#1A251E] placeholder-gray-300 focus:outline-none focus:border-[#D4A373] focus:ring-4 focus:ring-[#D4A373]/10 transition-all duration-300"
              />
            </div>
          </div>

          {/* Input Password */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A251E]/70 mb-2 pl-1">Kata Sandi</label>
            <div className="relative group">
              <Key className="w-5 h-5 text-gray-400 absolute left-4 top-3.5 group-focus-within:text-[#D4A373] transition-colors" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border-2 border-[#E8E3D9] rounded-2xl pl-12 pr-4 py-3.5 text-sm text-[#1A251E] placeholder-gray-300 focus:outline-none focus:border-[#D4A373] focus:ring-4 focus:ring-[#D4A373]/10 transition-all duration-300"
              />
            </div>
          </div>

          {/* Tombol Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1A251E] text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#D4A373] hover:text-[#1A251E] hover:shadow-lg hover:shadow-[#D4A373]/30 transition-all duration-300 mt-8 flex justify-center items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Memproses...
              </>
            ) : 'Masuk ke Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}