import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Package,
  ShoppingBag,
  Upload,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Layers,
  Sparkles,
  Link as LinkIcon,
  User,
  Film,
  Check,
  Percent,
} from 'lucide-react';
import { Product, AffiliateSample, Account, Employee, ScopeType, SampleStatus } from '../../types';
import { createProduct } from '../../services/productService';
import { createSample } from '../../services/sampleService';
import { CurrencyInput } from '../CurrencyInput';
import { formatRupiah, tanggalHariIni } from '../../utils/formatters';
import { AIScanResult } from '../../services/aiScanService';

interface AddProductSampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  employees: Employee[];
  existingProducts: Product[];
  currentUserId: string;
  currentUserName: string;
  defaultScope: ScopeType;
  canChooseScope: boolean;
  initialScanData?: AIScanResult | null;
  onSaved: (result: { product: Product; sample?: AffiliateSample }) => void;
}

const KATEGORI_OPTIONS = [
  'Skincare & Kecantikan',
  'Fashion & Pakaian',
  'Mainan & Hobi',
  'Baju Anak & Bayi',
  'Elektronik & Gadget',
  'Rumah Tangga & Dapur',
  'Otomotif & Aksesoris',
  'Makanan & Minuman',
  'Kesehatan & Kebugaran',
  'Lainnya',
];

const SAMPLE_STATUS_OPTIONS: { value: SampleStatus; label: string }[] = [
  { value: 'DIPESAN', label: 'Dipesan (Dalam Proses Order)' },
  { value: 'DIKIRIM', label: 'Dikirim (Dalam Ekspedisi)' },
  { value: 'DITERIMA', label: 'Diterima (Siap Buat Konten)' },
  { value: 'DIGUNAKAN', label: 'Digunakan (Sedang Dipakai Syuting/Live)' },
  { value: 'SELESAI', label: 'Selesai (Target VT Tercapai)' },
];

export const AddProductSampleModal: React.FC<AddProductSampleModalProps> = ({
  isOpen,
  onClose,
  accounts,
  employees,
  existingProducts,
  currentUserId,
  currentUserName,
  defaultScope,
  canChooseScope,
  initialScanData,
  onSaved,
}) => {
  // 1. INFORMASI PRODUK STATES
  const [productName, setProductName] = useState<string>('');
  const [productPrice, setProductPrice] = useState<number | ''>('');
  const [productUrl, setProductUrl] = useState<string>('');
  const [productImage, setProductImage] = useState<string>('');
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [platform, setPlatform] = useState<'TikTok' | 'Shopee' | 'MANUAL'>('TikTok');
  const [category, setCategory] = useState<string>('Skincare & Kecantikan');
  const [commissionRate, setCommissionRate] = useState<number | ''>(''); // MANUAL ONLY
  const [productNotes, setProductNotes] = useState<string>('');
  const [scope, setScope] = useState<ScopeType>(defaultScope);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  // 2. INFORMASI SAMPEL STATES
  const [isBuyingSample, setIsBuyingSample] = useState<boolean>(true); // [ YA ] by default
  const [samplePrice, setSamplePrice] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [purchaseDate, setPurchaseDate] = useState<string>(tanggalHariIni());
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<string>('');
  const [targetContent, setTargetContent] = useState<number>(3);
  const [sampleStatus, setSampleStatus] = useState<SampleStatus>('DIPESAN');
  const [sampleNotes, setSampleNotes] = useState<string>('');

  // 3. DUPLICATE CHECK & RESOLUTION
  const [matchingProduct, setMatchingProduct] = useState<Product | null>(null);
  const [useExistingProduct, setUseExistingProduct] = useState<boolean>(false);

  // 4. SUBMIT STATES
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize or Reset Form
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setIsSubmitting(false);
      setUseExistingProduct(false);
      setMatchingProduct(null);

      // Default Account & Employee
      const defaultAcc = accounts[0]?.id || '';
      setSelectedAccountId(defaultAcc);

      // Find if current user is in employees list
      const matchedEmp = employees.find(
        (e) => e.userId === currentUserId || e.id === currentUserId
      );
      setAssignedEmployeeId(matchedEmp?.id || employees[0]?.id || '');

      if (initialScanData) {
        // Pre-fill from AI Scan
        setProductName(initialScanData.productName || '');
        setProductPrice(initialScanData.productPrice || '');
        setSamplePrice(initialScanData.productPrice || '');
        setPlatform(initialScanData.platform || 'TikTok');
        setCategory(initialScanData.category || 'Skincare & Kecantikan');
        setProductImage(initialScanData.productImageUrl || '');
        setProductUrl(initialScanData.productUrl || '');
        setCommissionRate(''); // Komisi Affiliate tetap MANUAL
        setProductNotes(
          initialScanData.aiRecommendations
            ? `[AI Catatan]: ${initialScanData.aiRecommendations}`
            : ''
        );
        setIsBuyingSample(true);
        setQuantity(1);
        setPurchaseDate(tanggalHariIni());
        setTargetContent(3);
        setSampleStatus('DIPESAN');
        setSampleNotes('');
        setScope(defaultScope);
      } else {
        // Manual Clean Form
        setProductName('');
        setProductPrice('');
        setSamplePrice('');
        setPlatform('TikTok');
        setCategory('Skincare & Kecantikan');
        setProductImage('');
        setProductUrl('');
        setCommissionRate('');
        setProductNotes('');
        setIsBuyingSample(true);
        setQuantity(1);
        setPurchaseDate(tanggalHariIni());
        setTargetContent(3);
        setSampleStatus('DIPESAN');
        setSampleNotes('');
        setScope(defaultScope);
      }
    }
  }, [isOpen, initialScanData, defaultScope, accounts, employees, currentUserId]);

  // Synchronize sample price with product price if not manually diverged
  const handleProductPriceChange = (val: number) => {
    setProductPrice(val);
    if (!samplePrice || samplePrice === productPrice) {
      setSamplePrice(val);
    }
  };

  // Real-time duplicate check
  useEffect(() => {
    if (!productName.trim()) {
      setMatchingProduct(null);
      setUseExistingProduct(false);
      return;
    }

    const cleanInputName = productName.trim().toLowerCase();
    const cleanInputUrl = productUrl.trim().toLowerCase();

    const match = existingProducts.find((p) => {
      const pName = (p.productName || '').trim().toLowerCase();
      const pUrl = (p.productUrl || '').trim().toLowerCase();

      // Exact name match or exact url match
      if (pName === cleanInputName && cleanInputName.length > 2) return true;
      if (cleanInputUrl && pUrl === cleanInputUrl && cleanInputUrl.length > 8) return true;
      return false;
    });

    if (match) {
      setMatchingProduct(match);
    } else {
      setMatchingProduct(null);
      setUseExistingProduct(false);
    }
  }, [productName, productUrl, existingProducts]);

  // Image Upload Handler
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar JPG, PNG, atau WebP.');
      return;
    }

    setSelectedPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setProductImage(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Calculated Total Belanja Sampel = Harga Sampel × Qty
  const numericSamplePrice = Number(samplePrice) || 0;
  const numericQty = Math.max(1, Number(quantity) || 1);
  const totalBelanjaSampel = numericSamplePrice * numericQty;

  // Single Save Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!productName.trim()) {
      setErrorMessage('Nama Produk wajib diisi.');
      return;
    }

    if (isBuyingSample && (!numericSamplePrice || numericSamplePrice <= 0)) {
      if (
        !window.confirm(
          'Harga sampel bernilai Rp 0 atau belum diisi. Apakah sampel ini berstatus GRATIS (Free Endorsement)?'
        )
      ) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let finalProductId = '';
      let savedProduct: Product;

      // 1. PRODUCT RESOLUTION: Existing vs New Product
      if (useExistingProduct && matchingProduct?.id) {
        finalProductId = matchingProduct.id;
        savedProduct = matchingProduct;
      } else {
        // Create new Product record
        const combinedNotes = [
          platform ? `Platform: ${platform}` : '',
          productNotes.trim(),
        ]
          .filter(Boolean)
          .join(' | ');

        const productPayload: Omit<Product, 'id' | 'productId' | 'createdAt' | 'updatedAt'> = {
          productName: productName.trim(),
          productPrice: Number(productPrice) || 0,
          productUrl: productUrl.trim(),
          productImage: productImage || '',
          category,
          commissionRate: Number(commissionRate) || 0,
          scope,
          status: 'AKTIF',
          notes: combinedNotes,
          accountIds: selectedAccountId ? [selectedAccountId] : [],
          createdBy: currentUserId,
          createdByName: currentUserName,
        };

        finalProductId = await createProduct(
          productPayload,
          selectedPhotoFile || null,
          currentUserId,
          currentUserName
        );

        savedProduct = {
          id: finalProductId,
          productId: finalProductId,
          ...productPayload,
        };
      }

      // 2. SAMPLE RESOLUTION: If YA -> Save Sample pointing to finalProductId
      let savedSample: AffiliateSample | undefined = undefined;

      if (isBuyingSample) {
        const assignedEmp = employees.find((e) => e.id === assignedEmployeeId);
        const assignedAcc = accounts.find((a) => a.id === selectedAccountId);

        const samplePayload: Omit<AffiliateSample, 'id' | 'sampleId' | 'createdAt' | 'updatedAt'> = {
          productId: finalProductId,
          productName: productName.trim(),
          productUrl: productUrl.trim(),
          productImage: productImage || '',
          samplePrice: numericSamplePrice,
          quantity: numericQty,
          totalCost: totalBelanjaSampel,
          purchaseDate: purchaseDate || tanggalHariIni(),
          employeeId: assignedEmployeeId || '',
          employeeName: assignedEmp?.name || '',
          accountId: selectedAccountId || '',
          accountName: assignedAcc?.accountName || '',
          targetContent: Number(targetContent) || 3,
          completedContent: 0,
          unitContent: 'VT',
          status: sampleStatus,
          scope,
          notes: sampleNotes.trim(),
          createdBy: currentUserId,
          createdByName: currentUserName,
        };

        const sampleId = await createSample(
          samplePayload,
          false, // Do not create financial expense automatically unless requested
          true,  // Auto create daily task for PIC talent
          currentUserId,
          currentUserName
        );

        savedSample = {
          id: sampleId,
          sampleId,
          ...samplePayload,
        };
      }

      // Trigger success callback
      onSaved({ product: savedProduct, sample: savedSample });
      onClose();
    } catch (err: any) {
      console.error('[SAVE_PRODUCT_SAMPLE_ERROR]', err);
      setErrorMessage(err.message || 'Gagal menyimpan data produk & sampel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-3xl bg-white text-zinc-900 shadow-2xl border border-zinc-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 bg-zinc-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  TAMBAH PRODUK & SAMPEL
                </h3>
                {initialScanData && (
                  <span className="text-[10px] font-black uppercase bg-emerald-500 text-zinc-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> AI SCANNED
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Satu formulir terpadu untuk katalog produk dan pencatatan sampel affiliate
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Error Message */}
          {errorMessage && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-800 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* DUPLICATE WARNING BOX */}
          {matchingProduct && (
            <div className="rounded-2xl bg-amber-50 border-2 border-amber-300 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                    ⚠️ Produk Ini Sudah Terdaftar di Database!
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Ditemukan produk serupa: <strong className="text-zinc-900 font-extrabold">{matchingProduct.productName}</strong> ({matchingProduct.platform || 'TikTok'} - {formatRupiah(matchingProduct.productPrice || 0)}).
                  </p>
                </div>
              </div>

              {/* Action Choices for Duplicates */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/80">
                <button
                  type="button"
                  onClick={() => setUseExistingProduct(true)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    useExistingProduct
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-white text-zinc-700 border border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  <Check className="h-4 w-4" />
                  <span>[ 🔗 GUNAKAN PRODUK YANG SUDAH ADA ]</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUseExistingProduct(false)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    !useExistingProduct
                      ? 'bg-zinc-800 text-white shadow-md'
                      : 'bg-white text-zinc-700 border border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  <span>[ ➕ TETAP BUAT PRODUK BARU ]</span>
                </button>
              </div>

              {useExistingProduct && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-[11px] font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Sampel baru akan langsung dihubungkan ke Master Produk ID: {matchingProduct.id} tanpa membuat produk duplikat.</span>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* BAGIAN 1: INFORMASI PRODUK                                        */}
          {/* ================================================================= */}
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-800 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-indigo-600" />
                1. INFORMASI PRODUK
              </h4>
              <span className="text-[10px] font-bold text-zinc-400">Wajib diisi</span>
            </div>

            {/* Nama Produk & Platform */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Nama Produk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Contoh: Skintific 5X Ceramide Barrier Moisture Gel 30g"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs font-bold text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs font-bold text-zinc-900 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="TikTok">TikTok Shop</option>
                  <option value="Shopee">Shopee Video</option>
                  <option value="MANUAL">Lainnya / Manual</option>
                </select>
              </div>
            </div>

            {/* Harga Produk & Komisi Affiliate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Harga Produk (Katalog)
                </label>
                <CurrencyInput
                  value={productPrice === '' ? 0 : Number(productPrice)}
                  onChange={handleProductPriceChange}
                  placeholder="Rp 0"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs font-black text-zinc-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Komisi Affiliate (%) <span className="text-[10px] text-zinc-400 font-normal">(Manual)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Contoh: 10"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs font-bold text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-zinc-400">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Kategori Produk
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs font-bold text-zinc-900 focus:border-emerald-500 focus:outline-none"
                >
                  {KATEGORI_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Link Produk & Foto Produk */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Link Toko / Produk
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="url"
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    placeholder="https://vt.tiktok.com/ZS... atau https://shopee.co.id/..."
                    className="w-full rounded-xl border border-zinc-300 bg-white pl-9 pr-3.5 py-2.5 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Foto Produk
                </label>
                <div className="flex items-center gap-3">
                  {productImage ? (
                    <div className="relative h-11 w-11 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100 shrink-0">
                      <img
                        src={productImage}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setProductImage('')}
                        className="absolute top-0 right-0 bg-black/70 text-white rounded-bl p-0.5 hover:bg-rose-600"
                        title="Hapus foto"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : null}

                  <div className="flex-1 flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5 text-zinc-500" />
                      <span>{productImage ? 'Ganti Foto' : 'Upload Foto'}</span>
                    </button>

                    <input
                      type="text"
                      value={productImage.startsWith('data:') ? 'Foto terupload dari perangkat' : productImage}
                      onChange={(e) => !productImage.startsWith('data:') && setProductImage(e.target.value)}
                      placeholder="Atau tempel URL gambar..."
                      disabled={productImage.startsWith('data:')}
                      className="flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Scope & Catatan */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {canChooseScope && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Scope Bisnis
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setScope('SHARING')}
                      className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        scope === 'SHARING'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      SHARING
                    </button>
                    <button
                      type="button"
                      onClick={() => setScope('PRIBADI')}
                      className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        scope === 'PRIBADI'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      PRIBADI
                    </button>
                  </div>
                </div>
              )}

              <div className={canChooseScope ? 'md:col-span-2' : 'md:col-span-3'}>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Catatan Produk
                </label>
                <input
                  type="text"
                  value={productNotes}
                  onChange={(e) => setProductNotes(e.target.value)}
                  placeholder="Catatan strategi konten, angle hook, promo live, dll."
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* BAGIAN 2: INFORMASI SAMPEL                                        */}
          {/* ================================================================= */}
          <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/40 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200 pb-3">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-2">
                  <Package className="h-4 w-4 text-emerald-700" />
                  2. INFORMASI SAMPEL
                </h4>
                <p className="text-[11px] text-emerald-800">
                  Apakah produk ini dibeli/dipesan sebagai sampel fisik untuk konten?
                </p>
              </div>

              {/* YA / TIDAK TOGGLE */}
              <div className="flex items-center gap-2 bg-emerald-100/80 p-1 rounded-2xl border border-emerald-300">
                <button
                  type="button"
                  onClick={() => setIsBuyingSample(true)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isBuyingSample
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-emerald-900 hover:bg-emerald-200/60'
                  }`}
                >
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                  <span>[ YA, BELI SAMPEL ]</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBuyingSample(false)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    !isBuyingSample
                      ? 'bg-zinc-800 text-white shadow-md'
                      : 'text-zinc-600 hover:bg-zinc-200/60'
                  }`}
                >
                  <span>[ TIDAK ]</span>
                </button>
              </div>
            </div>

            {/* JIKA YA -> TAMPILKAN FORM SAMPEL LENGKAP */}
            {isBuyingSample ? (
              <div className="space-y-4 pt-1">
                {/* Harga Sampel & Qty & Total Belanja */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Harga Sampel (Satuan) <span className="text-rose-500">*</span>
                    </label>
                    <CurrencyInput
                      value={samplePrice === '' ? 0 : Number(samplePrice)}
                      onChange={(val) => setSamplePrice(val)}
                      placeholder="Rp 0"
                      className="w-full rounded-xl border border-emerald-300 bg-white px-3.5 py-2.5 text-xs font-black text-zinc-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Jumlah / Qty <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full rounded-xl border border-emerald-300 bg-white px-3.5 py-2.5 text-xs font-black text-zinc-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Total Belanja Sampel
                    </label>
                    <div className="rounded-xl border border-emerald-300 bg-emerald-100/70 px-3.5 py-2.5 text-xs font-black text-emerald-950 flex items-center justify-between">
                      <span>{formatRupiah(totalBelanjaSampel)}</span>
                      <span className="text-[10px] text-emerald-800 font-semibold uppercase">
                        ({numericQty} pcs)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tanggal Beli & PIC Talent & Target VT */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Tanggal Pembelian
                    </label>
                    <input
                      type="date"
                      required
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full rounded-xl border border-emerald-300 bg-white px-3.5 py-2.5 text-xs font-bold text-zinc-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      PIC / Talent Konten
                    </label>
                    <select
                      value={assignedEmployeeId}
                      onChange={(e) => setAssignedEmployeeId(e.target.value)}
                      className="w-full rounded-xl border border-emerald-300 bg-white px-3.5 py-2.5 text-xs font-bold text-zinc-900 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="">-- Pilih PIC / Talent --</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.position})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Target VT (Konten)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={targetContent}
                        onChange={(e) => setTargetContent(Math.max(1, Number(e.target.value) || 1))}
                        className="w-full rounded-xl border border-emerald-300 bg-white px-3.5 py-2.5 text-xs font-black text-zinc-900 focus:border-emerald-500 focus:outline-none"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs font-bold text-zinc-400">VT</span>
                    </div>
                  </div>
                </div>

                {/* Status Sampel & Akun Medsos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Status Sampel
                    </label>
                    <select
                      value={sampleStatus}
                      onChange={(e) => setSampleStatus(e.target.value as SampleStatus)}
                      className="w-full rounded-xl border border-emerald-300 bg-white px-3.5 py-2.5 text-xs font-bold text-zinc-900 focus:border-emerald-500 focus:outline-none"
                    >
                      {SAMPLE_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Akun Medsos Terkait
                    </label>
                    <select
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                      className="w-full rounded-xl border border-emerald-300 bg-white px-3.5 py-2.5 text-xs font-bold text-zinc-900 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="">-- Pilih Akun Medsos --</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountName} ({acc.scope})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Catatan Sampel */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Catatan Sampel / Pengiriman
                  </label>
                  <input
                    type="text"
                    value={sampleNotes}
                    onChange={(e) => setSampleNotes(e.target.value)}
                    placeholder="Contoh: No. Resi J&T: JNT123456, tiba estimasi 2 hari lagi..."
                    className="w-full rounded-xl border border-emerald-300 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-zinc-100 p-3 text-center text-xs font-bold text-zinc-500">
                Data sampel tidak akan dibuat. Sistem hanya menyimpan Master Produk ke dalam database.
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="border-t border-zinc-200 px-6 py-4 bg-zinc-50 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-6 py-2.5 text-xs font-black shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Menyimpan ke Firestore...</span>
            ) : isBuyingSample ? (
              <>
                <Check className="h-4 w-4 stroke-[3]" />
                <span>[ 💾 SIMPAN PRODUK & SAMPEL ]</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4 stroke-[3]" />
                <span>[ 💾 SIMPAN PRODUK ]</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
