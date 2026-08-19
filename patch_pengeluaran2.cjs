const fs = require('fs');
let code = fs.readFileSync('src/pages/PengeluaranPage.tsx', 'utf8');

const submitBtns = `
              <div className="flex justify-between items-center pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 font-semibold text-zinc-600 hover:bg-zinc-100"
                >
                  Batal
                </button>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </div>
`;

code = code.replace(/<div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">[\s\S]*?<\/div>/, submitBtns.trim());

fs.writeFileSync('src/pages/PengeluaranPage.tsx', code);
