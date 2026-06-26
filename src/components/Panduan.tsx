import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, BookOpen, Info } from 'lucide-react';

interface PanduanProps {
  isDark: boolean;
  primaryColor: string;
  appSettings?: any;
}

export const Panduan: React.FC<PanduanProps> = ({ isDark, primaryColor, appSettings }) => {
  const [openSections, setOpenSections] = useState<string[]>(['panduan_1']);

  const toggleSection = (id: string) => {
    setOpenSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const defaultGuides = [
    {
      id: 'panduan_1',
      title: '1. Panduan buat tiket bantuan IT',
      content: (
        <div className="space-y-4">
          <p className="text-sm">
            Berikut adalah langkah-langkah untuk membuat tiket bantuan IT:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>Pastikan Anda telah mengaktifkan layanan lokasi (GPS) pada perangkat Anda.</li>
            <li>Klik tombol ikon <strong>Buat Tiket</strong> pada menu navigasi.</li>
            <li>Isi form tiket dengan informasi yang diperlukan: Nama, Departemen, Kategori, dan Deskripsi kendala.</li>
            <li>Gunakan fitur foto untuk memfoto wajah atau kondisi kendala. Foto wajah adalah wajib.</li>
            <li>Setelah semua data terisi, tekan tombol <strong>Kirim</strong>.</li>
            <li>Anda akan menerima nomor tiket untuk melacak status penanganan.</li>
          </ol>
          <div className={`p-3 rounded-xl flex gap-3 items-start ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700'}`}>
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-xs font-medium">
              Mohon pastikan GPS aktif karena kami memerlukan lokasi Anda untuk penanganan yang lebih cepat.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'panduan_2',
      title: '2. Cara melihat status tiket',
      content: (
        <div className="space-y-4">
          <p className="text-sm">
            Untuk memantau status tiket yang telah Anda buat:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>Buka menu <strong>Riwayat</strong> pada navigasi bawah.</li>
            <li>Masukkan nomor WhatsApp atau identitas yang Anda gunakan saat membuat tiket.</li>
            <li>Anda dapat melihat semua riwayat tiket yang terkait beserta status terbarunya.</li>
          </ul>
        </div>
      )
    }
  ];

  let guides = defaultGuides;
  try {
    if (appSettings?.panduan_guides) {
      const parsed = JSON.parse(appSettings.panduan_guides);
      if (Array.isArray(parsed) && parsed.length > 0) {
        guides = parsed.map((g: any, i: number) => ({
          id: g.id || `custom_panduan_${i}`,
          title: g.title || `Panduan ${i + 1}`,
          content: <div className="text-sm whitespace-pre-wrap">{g.content || ''}</div>
        }));
      }
    }
  } catch (e) {
    console.error("Failed to parse panduan_guides", e);
  }

  return (
    <div className={`w-full max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-slate-100'}`}>
      <div className={`p-6 sm:p-8 border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: primaryColor }}>
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Panduan Penggunaan</h2>
            <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Kumpulan panduan untuk mempermudah penggunaan sistem IT Helpdesk</p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-4">
        {guides.map((guide) => {
          const isOpen = openSections.includes(guide.id);
          return (
            <div 
              key={guide.id}
              className={`rounded-2xl border overflow-hidden transition-all duration-300 ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}
            >
              <button
                onClick={() => toggleSection(guide.id)}
                className={`w-full flex items-center justify-between p-4 sm:p-5 text-left transition-colors ${isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-slate-100'}`}
              >
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {guide.title}
                </h3>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-white text-slate-500 shadow-sm'}`}>
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>
              
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className={`p-4 sm:p-5 pt-0 border-t ${isDark ? 'border-zinc-800 text-zinc-300' : 'border-slate-200 text-slate-600'}`}>
                      {guide.content}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
