const fs = require('fs');

const path = 'src/pages/PengaturanKantorPage.tsx';
let code = fs.readFileSync(path, 'utf8');

// Imports
code = code.replace(
  /import \{\n  hapusHariLibur,/,
  `import {
  hapusHariLibur,
  subscribeOfficeLocation,
  updateOfficeLocation,`
);

code = code.replace(
  /import \{ Holiday, WorkplaceSchedule, ProfitSharingTier, DEFAULT_PROFIT_SHARING_TIERS \} from '\.\.\/types';/,
  `import { Holiday, WorkplaceSchedule, OfficeLocation, ProfitSharingTier, DEFAULT_PROFIT_SHARING_TIERS } from '../types';`
);

// State
const stateInject = `
  const [office, setOffice] = useState<OfficeLocation>({
    officeName: 'Kantor PT.KDRT',
    latitude: -6.2088,
    longitude: 106.8456,
    radius: 100
  });
  const [savingOffice, setSavingOffice] = useState(false);
`;
code = code.replace(/const \[schedule, setSchedule\] = useState<WorkplaceSchedule>\(\{/, stateInject + '\n  const [schedule, setSchedule] = useState<WorkplaceSchedule>({');

// Effect
const effectInject = `
    const unsubOffice = subscribeOfficeLocation((data) => {
       if(data) setOffice(data);
    });
`;
code = code.replace(/const unsubSchedule = subscribeWorkplaceSchedule\(\(data\) => \{/, effectInject + '\n    const unsubSchedule = subscribeWorkplaceSchedule((data) => {');

// Cleanup
code = code.replace(/unsubSchedule\(\);\n      unsubHolidays\(\);/, 'unsubSchedule();\n      unsubHolidays();\n      unsubOffice();');

// Handler
const handlerInject = `
  const handleSaveOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile) return;
    setSavingOffice(true);
    try {
      await updateOfficeLocation(office, currentUser.uid, userProfile.name);
      alert('Lokasi kantor berhasil disimpan.');
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan lokasi.');
    } finally {
      setSavingOffice(false);
    }
  };
`;
code = code.replace(/const handleSaveSchedule = async \(e: React.FormEvent\) => \{/, handlerInject + '\n  const handleSaveSchedule = async (e: React.FormEvent) => {');

// UI
const uiInject = `
      {/* ========================================================================= */}
      {/* LOKASI GEOFENCE                                                          */}
      {/* ========================================================================= */}
      <form onSubmit={handleSaveOffice} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs mt-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-indigo-600" />
              <span>LOKASI GEOFENCE KANTOR</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tentukan koordinat GPS kantor untuk validasi absensi (Check-In/Out).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Latitude</label>
            <input
              type="number"
              step="any"
              required
              value={office.latitude}
              onChange={(e) => setOffice({ ...office, latitude: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-300 p-2.5 font-bold"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Longitude</label>
            <input
              type="number"
              step="any"
              required
              value={office.longitude}
              onChange={(e) => setOffice({ ...office, longitude: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-300 p-2.5 font-bold"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Radius (meter)</label>
            <input
              type="number"
              required
              min="10"
              value={office.radius}
              onChange={(e) => setOffice({ ...office, radius: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-300 p-2.5 font-bold"
            />
          </div>
        </div>

        {role === 'OWNER' && (
          <div className="flex justify-end mt-4 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={savingOffice}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{savingOffice ? 'Menyimpan...' : 'Simpan Lokasi'}</span>
            </button>
          </div>
        )}
      </form>
`;
code = code.replace(/\{\/\* 2\. DAFTAR HARI LIBUR NASIONAL/, uiInject + '\n      {/* 2. DAFTAR HARI LIBUR NASIONAL');
code = code.replace(/import {([^}]*)Clock,([^}]*)} from 'lucide-react';/, `import {$1Clock, MapPin,$2} from 'lucide-react';`);

fs.writeFileSync(path, code);
