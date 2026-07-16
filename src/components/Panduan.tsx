import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Info, 
  Edit3, 
  Plus, 
  Trash2, 
  Save, 
  X, 
  RefreshCw,
  Eye,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Image as ImageIcon,
  Link as LinkIcon,
  Palette,
  Type,
  Eraser,
  Heading,
  Upload,
  Globe
} from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';

interface PanduanProps {
  isDark: boolean;
  primaryColor: string;
  appSettings?: any;
  setAppSettings?: (settings: any) => void;
  adminUser?: any;
}

// Custom Rich Text Editor Component
interface RichEditorProps {
  initialValue: string;
  onChange: (value: string) => void;
  isDark: boolean;
  primaryColor: string;
}

const RichEditor: React.FC<RichEditorProps> = ({ initialValue, onChange, isDark, primaryColor }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Toolbar and Modal states
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    insertOrderedList: false,
    insertUnorderedList: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
  });

  const [showImagePopover, setShowImagePopover] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkUrlInput, setLinkUrlInput] = useState('');

  const [selectedFont, setSelectedFont] = useState('Inter');
  const [selectedSize, setSelectedSize] = useState('3'); // corresponds to 16px (Normal)
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== initialValue) {
      editorRef.current.innerHTML = initialValue || '';
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      let html = editorRef.current.innerHTML;
      // Strip active-selected-img class and clear empty class attributes
      html = html.replace(/\s*active-selected-img/g, '');
      html = html.replace(/class=""/g, '');
      onChange(html);
    }
    updateActiveFormats();
  };

  const execCommand = (command: string, value: string = '') => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, value);
    handleInput();
  };

  const updateActiveFormats = () => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      justifyLeft: document.queryCommandState('justifyLeft'),
      justifyCenter: document.queryCommandState('justifyCenter'),
      justifyRight: document.queryCommandState('justifyRight'),
    });
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    
    // Remove active class from all other images inside this editor
    if (editorRef.current) {
      const imgs = editorRef.current.querySelectorAll('img');
      imgs.forEach(img => img.classList.remove('active-selected-img'));
    }

    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      img.classList.add('active-selected-img');
      setSelectedImage(img);
    } else {
      setSelectedImage(null);
    }
  };

  const setImageWidth = (width: string) => {
    if (selectedImage) {
      if (width === 'auto') {
        selectedImage.style.width = 'auto';
      } else {
        selectedImage.style.width = width;
      }
      handleInput();
    }
  };

  const setImageAlign = (align: 'left' | 'center' | 'right') => {
    if (selectedImage) {
      if (align === 'left') {
        selectedImage.style.display = 'inline';
        selectedImage.style.float = 'left';
        selectedImage.style.margin = '8px 16px 8px 0';
      } else if (align === 'right') {
        selectedImage.style.display = 'inline';
        selectedImage.style.float = 'right';
        selectedImage.style.margin = '8px 0 8px 16px';
      } else {
        selectedImage.style.display = 'block';
        selectedImage.style.float = 'none';
        selectedImage.style.margin = '16px auto';
      }
      handleInput();
    }
  };

  const deleteImage = () => {
    if (selectedImage) {
      selectedImage.remove();
      setSelectedImage(null);
      handleInput();
      toast.success('Gambar berhasil dihapus');
    }
  };

  // Handle local image file upload & base64 conversion
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result;
        if (base64 && typeof base64 === 'string') {
          execCommand('insertImage', base64);
          setShowImagePopover(false);
          setImageUrlInput('');
          toast.success('Gambar berhasil ditambahkan!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInsertImageUrl = () => {
    if (!imageUrlInput.trim()) {
      toast.error('Masukkan URL gambar terlebih dahulu');
      return;
    }
    execCommand('insertImage', imageUrlInput.trim());
    setShowImagePopover(false);
    setImageUrlInput('');
    toast.success('Gambar berhasil disisipkan!');
  };

  const handleInsertLink = () => {
    if (!linkUrlInput.trim()) {
      toast.error('Masukkan URL link terlebih dahulu');
      return;
    }
    execCommand('createLink', linkUrlInput.trim());
    setShowLinkPopover(false);
    setLinkUrlInput('');
    toast.success('Link berhasil ditambahkan!');
  };

  const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const font = e.target.value;
    setSelectedFont(font);
    execCommand('fontName', font);
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const size = e.target.value;
    setSelectedSize(size);
    execCommand('fontSize', size);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    execCommand('foreColor', e.target.value);
  };

  const handleBgColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    execCommand('hiliteColor', e.target.value);
  };

  const fontOptions = [
    { label: 'Inter (Clean)', value: 'Inter' },
    { label: 'Georgia (Serif)', value: 'Georgia' },
    { label: 'Courier (Mono)', value: 'Courier' },
    { label: 'Comic Sans (Playful)', value: 'Comic Sans' },
  ];

  const sizeOptions = [
    { label: 'Kecil (11px)', value: '1' },
    { label: 'Sedang (13px)', value: '2' },
    { label: 'Normal (16px)', value: '3' },
    { label: 'Besar (18px)', value: '4' },
    { label: 'Sub-Judul (24px)', value: '5' },
    { label: 'Judul Utama (32px)', value: '6' },
    { label: 'Sangat Besar (48px)', value: '7' },
  ];

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? 'border-zinc-800 bg-zinc-950/40' : 'border-slate-200 bg-slate-50/40'}`}>
      
      {/* MS Office inspired Rich Text Toolbar */}
      <div className={`p-3 border-b flex flex-wrap items-center gap-2 ${isDark ? 'border-zinc-800 bg-zinc-900/60' : 'border-slate-200 bg-slate-100/80'}`}>
        
        {/* Font Family selector */}
        <div className="flex items-center gap-1">
          <Type className="w-3.5 h-3.5 text-slate-400" />
          <select 
            value={selectedFont}
            onChange={handleFontChange}
            className={`px-2 py-1 rounded-lg text-xs font-semibold outline-none border cursor-pointer ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
          >
            {fontOptions.map(font => (
              <option key={font.value} value={font.value}>{font.label}</option>
            ))}
          </select>
        </div>

        {/* Font Size selector */}
        <div className="flex items-center gap-1">
          <Heading className="w-3.5 h-3.5 text-slate-400" />
          <select 
            value={selectedSize}
            onChange={handleSizeChange}
            className={`px-2 py-1 rounded-lg text-xs font-semibold outline-none border cursor-pointer ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
          >
            {sizeOptions.map(size => (
              <option key={size.value} value={size.value}>{size.label}</option>
            ))}
          </select>
        </div>

        <div className="w-[1px] h-6 bg-slate-300 dark:bg-zinc-700 mx-1"></div>

        {/* Basic formatting tools */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => execCommand('bold')}
            className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors ${activeFormats.bold ? 'bg-slate-200 text-slate-900 dark:bg-zinc-800 dark:text-white font-bold' : 'text-slate-500'}`}
            title="Tebal (Bold)"
          >
            <Bold className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={() => execCommand('italic')}
            className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors ${activeFormats.italic ? 'bg-slate-200 text-slate-900 dark:bg-zinc-800 dark:text-white' : 'text-slate-500'}`}
            title="Miring (Italic)"
          >
            <Italic className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCommand('underline')}
            className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors ${activeFormats.underline ? 'bg-slate-200 text-slate-900 dark:bg-zinc-800 dark:text-white' : 'text-slate-500'}`}
            title="Garis Bawah (Underline)"
          >
            <Underline className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCommand('strikeThrough')}
            className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors ${activeFormats.strikeThrough ? 'bg-slate-200 text-slate-900 dark:bg-zinc-800 dark:text-white' : 'text-slate-500'}`}
            title="Coret (Strikethrough)"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
        </div>

        <div className="w-[1px] h-6 bg-slate-300 dark:bg-zinc-700 mx-1"></div>

        {/* Color Palette selectors */}
        <div className="flex items-center gap-2">
          {/* Text Color picker */}
          <div className="flex items-center gap-1" title="Warna Teks">
            <Palette className="w-4 h-4 text-slate-500" />
            <input 
              type="color" 
              onChange={handleColorChange}
              defaultValue="#000000"
              className="w-5 h-5 rounded cursor-pointer border border-slate-300 dark:border-zinc-700 bg-transparent p-0 overflow-hidden" 
            />
          </div>

          {/* Highlight Color picker */}
          <div className="flex items-center gap-1" title="Sorotan / Highlight Teks">
            <span className="text-xs font-bold px-1 rounded bg-yellow-200 text-slate-800">Ab</span>
            <input 
              type="color" 
              onChange={handleBgColorChange}
              defaultValue="#ffff00"
              className="w-5 h-5 rounded cursor-pointer border border-slate-300 dark:border-zinc-700 bg-transparent p-0 overflow-hidden" 
            />
          </div>
        </div>

        <div className="w-[1px] h-6 bg-slate-300 dark:bg-zinc-700 mx-1"></div>

        {/* Alignment controls */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => execCommand('justifyLeft')}
            className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors ${activeFormats.justifyLeft ? 'bg-slate-200 text-slate-900 dark:bg-zinc-800 dark:text-white' : 'text-slate-500'}`}
            title="Rata Kiri"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={() => execCommand('justifyCenter')}
            className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors ${activeFormats.justifyCenter ? 'bg-slate-200 text-slate-900 dark:bg-zinc-800 dark:text-white' : 'text-slate-500'}`}
            title="Rata Tengah"
          >
            <AlignCenter className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCommand('justifyRight')}
            className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors ${activeFormats.justifyRight ? 'bg-slate-200 text-slate-900 dark:bg-zinc-800 dark:text-white' : 'text-slate-500'}`}
            title="Rata Kanan"
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>

        <div className="w-[1px] h-6 bg-slate-300 dark:bg-zinc-700 mx-1"></div>

        {/* Lists controls */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => execCommand('insertUnorderedList')}
            className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors ${activeFormats.insertUnorderedList ? 'bg-slate-200 text-slate-900 dark:bg-zinc-800 dark:text-white' : 'text-slate-500'}`}
            title="Daftar Bullets"
          >
            <List className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCommand('insertOrderedList')}
            className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors ${activeFormats.insertOrderedList ? 'bg-slate-200 text-slate-900 dark:bg-zinc-800 dark:text-white' : 'text-slate-500'}`}
            title="Daftar Angka"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>

        <div className="w-[1px] h-6 bg-slate-300 dark:bg-zinc-700 mx-1"></div>

        {/* Media insertion tools */}
        <div className="flex items-center gap-1.5 relative">
          
          {/* Link button */}
          <button
            type="button"
            onClick={() => {
              setShowLinkPopover(!showLinkPopover);
              setShowImagePopover(false);
            }}
            className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors text-slate-500 ${showLinkPopover ? 'bg-slate-200 dark:bg-zinc-800' : ''}`}
            title="Sisipkan Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>

          {/* Image insertion button */}
          <button
            type="button"
            onClick={() => {
              setShowImagePopover(!showImagePopover);
              setShowLinkPopover(false);
            }}
            className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors text-slate-500 ${showImagePopover ? 'bg-slate-200 dark:bg-zinc-800' : ''}`}
            title="Sisipkan Gambar (Upload / URL)"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCommand('removeFormat')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors text-rose-500"
            title="Hapus Format"
          >
            <Eraser className="w-4 h-4" />
          </button>

          {/* Hidden Local Image Upload */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />

          {/* Popover for inserting Link */}
          <AnimatePresence>
            {showLinkPopover && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`absolute left-0 top-10 z-50 p-4 rounded-xl border shadow-xl w-72 flex flex-col gap-2.5 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}
              >
                <div className="text-xs font-bold text-slate-400">MASUKKAN URL LINK</div>
                <input 
                  type="text" 
                  placeholder="https://example.com" 
                  value={linkUrlInput}
                  onChange={e => setLinkUrlInput(e.target.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs outline-none border ${isDark ? 'bg-zinc-950 border-zinc-800 text-white focus:border-zinc-700' : 'bg-white border-slate-200 text-slate-800 focus:border-slate-400'}`}
                />
                <div className="flex justify-end gap-1.5 mt-1">
                  <button 
                    type="button" 
                    onClick={() => setShowLinkPopover(false)}
                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  >
                    Batal
                  </button>
                  <button 
                    type="button" 
                    onClick={handleInsertLink}
                    style={{ backgroundColor: primaryColor }}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white shadow-md shadow-emerald-500/10 active:scale-95"
                  >
                    Tambah Link
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Popover for inserting Image (Upload or URL) */}
          <AnimatePresence>
            {showImagePopover && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`absolute left-0 top-10 z-50 p-4 rounded-xl border shadow-xl w-76 flex flex-col gap-3.5 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}
              >
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sisipkan Gambar</div>
                
                {/* File Upload Option */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 border border-dashed rounded-xl text-xs font-bold transition-all hover:bg-slate-100 dark:hover:bg-zinc-800 ${isDark ? 'border-zinc-800 text-zinc-300' : 'border-slate-200 text-slate-600'}`}
                >
                  <Upload className="w-4 h-4 text-emerald-500" />
                  Upload Gambar lokal (.png, .jpg)
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200 dark:border-zinc-800"></div>
                  <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-bold">ATAU</span>
                  <div className="flex-grow border-t border-slate-200 dark:border-zinc-800"></div>
                </div>

                {/* Web URL Option */}
                <div className="flex flex-col gap-1.5">
                  <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-sky-500" /> MASUKKAN URL GAMBAR INTERNET
                  </div>
                  <input 
                    type="text" 
                    placeholder="https://example.com/gambar.jpg" 
                    value={imageUrlInput}
                    onChange={e => setImageUrlInput(e.target.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs outline-none border ${isDark ? 'bg-zinc-950 border-zinc-800 text-white focus:border-zinc-700' : 'bg-white border-slate-200 text-slate-800 focus:border-slate-400'}`}
                  />
                </div>

                <div className="flex justify-end gap-1.5 mt-1 border-t pt-2 dark:border-zinc-800">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowImagePopover(false);
                      setImageUrlInput('');
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  >
                    Batal
                  </button>
                  <button 
                    type="button" 
                    onClick={handleInsertImageUrl}
                    style={{ backgroundColor: primaryColor }}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white shadow-md shadow-emerald-500/10 active:scale-95"
                  >
                    Sisipkan URL
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

      {/* Dynamic Image Formatting Panel (MS Office style) */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs font-bold ${isDark ? 'bg-emerald-950/20 border-zinc-800 text-emerald-400' : 'bg-emerald-50 border-slate-200 text-emerald-800'}`}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>PENGATURAN GAMBAR:</span>
            </div>
            
            <div className="flex items-center flex-wrap gap-4">
              {/* Size scaling buttons */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Ukuran:</span>
                {[
                  { label: '25%', value: '25%' },
                  { label: '50%', value: '50%' },
                  { label: '75%', value: '75%' },
                  { label: '100%', value: '100%' },
                  { label: 'Auto', value: 'auto' }
                ].map(opt => {
                  const isCurrent = selectedImage.style.width === opt.value || (!selectedImage.style.width && opt.value === 'auto');
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setImageWidth(opt.value)}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                        isCurrent 
                          ? 'bg-emerald-500 text-white border-emerald-500' 
                          : isDark 
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800' 
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div className="w-[1px] h-4 bg-slate-300 dark:bg-zinc-700"></div>

              {/* Alignment buttons */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Posisi:</span>
                {[
                  { label: 'Kiri (Rapat)', value: 'left' },
                  { label: 'Tengah (Baris Baru)', value: 'center' },
                  { label: 'Kanan (Rapat)', value: 'right' }
                ].map(opt => {
                  const floatStyle = selectedImage.style.float;
                  const displayStyle = selectedImage.style.display;
                  const isCurrent = 
                    (opt.value === 'left' && floatStyle === 'left') ||
                    (opt.value === 'right' && floatStyle === 'right') ||
                    (opt.value === 'center' && displayStyle === 'block' && floatStyle !== 'left' && floatStyle !== 'right');

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setImageAlign(opt.value as any)}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                        isCurrent 
                          ? 'bg-emerald-500 text-white border-emerald-500' 
                          : isDark 
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800' 
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div className="w-[1px] h-4 bg-slate-300 dark:bg-zinc-700"></div>

              {/* Delete button */}
              <button
                type="button"
                onClick={deleteImage}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border border-rose-500/20 text-rose-500 bg-rose-500/5 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                Hapus
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Content Area */}
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        onClick={handleEditorClick}
        onMouseUp={updateActiveFormats}
        onKeyUp={(e) => {
          // If they backspace or delete an image, clear selection state
          if (e.key === 'Backspace' || e.key === 'Delete') {
            const hasActiveImg = editorRef.current?.querySelector('.active-selected-img');
            if (!hasActiveImg) {
              setSelectedImage(null);
            }
          }
          updateActiveFormats();
        }}
        onFocus={updateActiveFormats}
        className={`w-full min-h-[250px] p-5 outline-none font-sans text-xs sm:text-sm leading-relaxed whitespace-normal rich-text-content ${isDark ? 'bg-zinc-950 text-white focus:bg-zinc-950/80' : 'bg-white text-slate-800 focus:bg-slate-50/50'}`}
        style={{ overflowY: 'auto' }}
      />
    </div>
  );
};

export const Panduan: React.FC<PanduanProps> = ({ 
  isDark, 
  primaryColor, 
  appSettings, 
  setAppSettings,
  adminUser 
}) => {
  const [openSections, setOpenSections] = useState<string[]>(['panduan_1']);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [editableGuides, setEditableGuides] = useState<any[]>([]);

  const toggleSection = (id: string) => {
    setOpenSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const defaultGuidesText = [
    {
      id: 'panduan_1',
      title: '1. Panduan buat tiket bantuan IT',
      content: `Berikut adalah langkah-langkah untuk membuat tiket bantuan IT:

1. Pastikan Anda telah mengaktifkan layanan lokasi (GPS) pada perangkat Anda.
2. Klik tombol ikon "Buat Tiket" pada menu navigasi.
3. Isi form tiket dengan informasi yang diperlukan: Nama, Departemen, Kategori, dan Deskripsi kendala.
4. Gunakan fitur foto untuk memfoto wajah atau kondisi kendala. Foto wajah adalah wajib.
5. Setelah semua data terisi, tekan tombol "Kirim".
6. Anda akan menerima nomor tiket untuk melacak status penanganan.

Catatan: Mohon pastikan GPS aktif karena kami memerlukan lokasi Anda untuk penanganan yang lebih cepat.`
    },
    {
      id: 'panduan_2',
      title: '2. Cara melihat status tiket',
      content: `Untuk memantau status tiket yang telah Anda buat:

- Buka menu "Riwayat" pada navigasi bawah.
- Masukkan nomor WhatsApp atau identitas yang Anda gunakan saat membuat tiket.
- Anda dapat melihat semua riwayat tiket yang terkait beserta status terbarunya.`
    }
  ];

  // Initialize editable guides when edit mode is opened
  useEffect(() => {
    if (isEditMode) {
      try {
        if (appSettings?.panduan_guides) {
          let parsed: any = null;
          if (Array.isArray(appSettings.panduan_guides)) {
            parsed = appSettings.panduan_guides;
          } else if (typeof appSettings.panduan_guides === 'string') {
            if (appSettings.panduan_guides === '[object Object]') {
              parsed = defaultGuidesText;
            } else {
              parsed = JSON.parse(appSettings.panduan_guides);
            }
          }

          if (Array.isArray(parsed) && parsed.length > 0) {
            setEditableGuides(parsed);
          } else {
            setEditableGuides(defaultGuidesText);
          }
        } else {
          setEditableGuides(defaultGuidesText);
        }
      } catch (e) {
        setEditableGuides(defaultGuidesText);
      }
    }
  }, [isEditMode, appSettings]);

  // Load guides for display
  const getGuides = () => {
    try {
      if (appSettings?.panduan_guides) {
        let parsed: any = null;
        if (Array.isArray(appSettings.panduan_guides)) {
          parsed = appSettings.panduan_guides;
        } else if (typeof appSettings.panduan_guides === 'string') {
          if (appSettings.panduan_guides === '[object Object]') {
            return defaultGuidesText;
          }
          parsed = JSON.parse(appSettings.panduan_guides);
        }

        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to parse panduan_guides", e);
    }
    return defaultGuidesText;
  };

  const guides = getGuides();

  const handleAddGuide = () => {
    setEditableGuides(prev => [
      ...prev,
      {
        id: `panduan_${Date.now()}`,
        title: `${prev.length + 1}. Panduan Baru`,
        content: ''
      }
    ]);
  };

  const handleRemoveGuide = (index: number) => {
    setEditableGuides(prev => prev.filter((_, i) => i !== index));
  };

  const handleGuideChange = (index: number, field: string, value: string) => {
    setEditableGuides(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = async () => {
    // Validate guides
    if (editableGuides.some(g => !g.title.trim())) {
      toast.error('Semua judul panduan harus diisi!');
      return;
    }

    setIsSaving(true);
    try {
      const updatedSettings = {
        ...appSettings,
        panduan_guides: JSON.stringify(editableGuides)
      };

      // Safely serialize array fields in settings for the server
      const payload = {
        ...updatedSettings,
        notification_emails: Array.isArray(appSettings?.notification_emails) 
          ? JSON.stringify(appSettings.notification_emails) 
          : appSettings?.notification_emails,
        telegram_chat_ids: Array.isArray(appSettings?.telegram_chat_ids) 
          ? JSON.stringify(appSettings.telegram_chat_ids) 
          : appSettings?.telegram_chat_ids
      };

      const response = await api.updateSettings(payload);
      
      if (response) {
        if (setAppSettings) {
          setAppSettings(updatedSettings);
        }
        toast.success('Panduan berhasil disimpan!');
        setIsEditMode(false);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal menyimpan panduan: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsSaving(false);
    }
  };

  const renderContent = (content: string) => {
    const isHtml = /<[a-z][\s\S]*>/i.test(content);
    if (isHtml) {
      return (
        <div 
          className="text-xs sm:text-sm leading-relaxed rich-text-content" 
          dangerouslySetInnerHTML={{ __html: content }} 
        />
      );
    }
    return (
      <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
        {content}
      </div>
    );
  };

  return (
    <div className={`w-full max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl transition-all ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-slate-100'}`}>
      
      {/* Dynamic Style Injection for beautiful Rich Text elements & alignments */}
      <style>{`
        .rich-text-content img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          margin: 16px 0;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          display: block;
          transition: outline 0.15s ease-in-out;
        }
        .rich-text-content img.active-selected-img {
          outline: 3px dashed #10b981 !important;
          outline-offset: 4px;
        }
        .rich-text-content ul {
          list-style-type: disc !important;
          padding-left: 2rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .rich-text-content ol {
          list-style-type: decimal !important;
          padding-left: 2rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .rich-text-content p {
          margin-bottom: 0.75rem !important;
          line-height: 1.6 !important;
        }
        .rich-text-content a {
          color: ${primaryColor} !important;
          text-decoration: underline !important;
          font-weight: bold !important;
        }
        .rich-text-content font[size="1"] { font-size: 11px !important; }
        .rich-text-content font[size="2"] { font-size: 13px !important; }
        .rich-text-content font[size="3"] { font-size: 16px !important; }
        .rich-text-content font[size="4"] { font-size: 18px !important; }
        .rich-text-content font[size="5"] { font-size: 24px !important; }
        .rich-text-content font[size="6"] { font-size: 32px !important; }
        .rich-text-content font[size="7"] { font-size: 48px !important; }

        .rich-text-content font[face="Inter"] { font-family: 'Inter', sans-serif !important; }
        .rich-text-content font[face="Georgia"] { font-family: Georgia, serif !important; }
        .rich-text-content font[face="Courier"] { font-family: 'Courier New', Courier, monospace !important; }
        .rich-text-content font[face="Comic Sans"] { font-family: 'Comic Sans MS', cursive !important; }
      `}</style>

      {/* Header */}
      <div className={`p-6 sm:p-8 border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: primaryColor }}>
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isEditMode ? 'Kelola Panduan' : 'Panduan Penggunaan'}
              </h2>
              <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                {isEditMode ? 'Tambah, ubah, atau hapus panduan bantuan sistem IT' : 'Kumpulan panduan untuk mempermudah penggunaan sistem IT Helpdesk'}
              </p>
            </div>
          </div>

          {/* Admin Controls */}
          {adminUser && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {isEditMode ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{ backgroundColor: primaryColor }}
                    className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/10 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Simpan
                  </button>
                  <button
                    onClick={() => setIsEditMode(false)}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
                  >
                    <X className="w-3.5 h-3.5" />
                    Batal
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditMode(true)}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
                >
                  <Edit3 className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                  Kelola Panduan
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 sm:p-8">
        <AnimatePresence mode="wait">
          {isEditMode ? (
            /* ================= EDIT MODE ================= */
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Daftar Panduan</span>
                <button
                  onClick={handleAddGuide}
                  className="flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all cursor-pointer text-emerald-500 border-emerald-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Panduan Baru
                </button>
              </div>

              <div className="space-y-6">
                {editableGuides.map((guide, index) => (
                  <div 
                    key={guide.id || index} 
                    className={`p-5 rounded-2xl border ${isDark ? 'bg-zinc-950/40 border-zinc-800' : 'bg-slate-50/50 border-slate-200'}`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Panduan #{index + 1}
                        </span>
                        <button
                          onClick={() => handleRemoveGuide(index)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all cursor-pointer"
                          title="Hapus Panduan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Title Input */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Sub Judul / Pertanyaan
                        </label>
                        <input
                          type="text"
                          value={guide.title}
                          onChange={(e) => handleGuideChange(index, 'title', e.target.value)}
                          placeholder="Contoh: 1. Cara buat tiket bantuan"
                          className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold outline-none focus:ring-2 transition-all ${isDark ? 'bg-zinc-900 border-zinc-800 text-white focus:ring-zinc-700' : 'bg-white border-slate-200 text-slate-800 focus:ring-slate-300'}`}
                        />
                      </div>

                      {/* Rich Text Editor Content Input */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Isi Panduan (Gaya MS Office: Format Font, Ukuran, Teks Tebal/Miring, Warna, List & Gambar)
                        </label>
                        <RichEditor
                          initialValue={guide.content}
                          onChange={(value) => handleGuideChange(index, 'content', value)}
                          isDark={isDark}
                          primaryColor={primaryColor}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {editableGuides.length === 0 && (
                  <div className="text-center py-12 border border-dashed rounded-2xl border-slate-200 dark:border-zinc-800">
                    <p className="text-xs text-slate-400 italic">Belum ada panduan. Tekan tombol di atas untuk menambahkan panduan baru.</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* ================= VIEW MODE ================= */
            <motion.div
              key="view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {guides.map((guide, idx) => {
                const isOpen = openSections.includes(guide.id);
                return (
                  <div 
                    key={guide.id || idx}
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
                            {renderContent(guide.content)}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {guides.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-xs text-slate-400 italic">Belum ada panduan penggunaan.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
