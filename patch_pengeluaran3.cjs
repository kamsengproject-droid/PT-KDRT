const fs = require('fs');
let code = fs.readFileSync('src/pages/PengeluaranPage.tsx', 'utf8');

const buktiInject = `
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Bukti (Opsional - URL/Tautan Gambar)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.receiptUrl}
                  onChange={(e) => setFormData({ ...formData, receiptUrl: e.target.value })}
                  className="w-full rounded-xl border border-zinc-300 p-2.5"
                />
              </div>
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Catatan Tambahan (Opsional)</label>
`;

code = code.replace(/<div>\n\s*<label className="block font-semibold text-zinc-700 mb-1">Catatan Tambahan \(Opsional\)<\/label>/, buktiInject.trim());

// Render Bukti in Table
const tableThReplace = `<th className="px-4 py-3">Jumlah (Rp)</th>
                <th className="px-4 py-3 text-center">Bukti</th>`;
code = code.replace(/<th className="px-4 py-3">Jumlah \(Rp\)<\/th>/, tableThReplace);

const tableTdReplace = `<td className="px-4 py-3.5 font-extrabold text-rose-600">{formatRupiah(item.amount)}</td>
                    <td className="px-4 py-3.5 text-center">
                      {item.receiptUrl ? (
                        <a href={item.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-bold text-[10px]">Lihat</a>
                      ) : (
                        <span className="text-zinc-400 italic text-[10px]">-</span>
                      )}
                    </td>`;
code = code.replace(/<td className="px-4 py-3.5 font-extrabold text-rose-600">\{formatRupiah\(item\.amount\)\}<\/td>/, tableTdReplace);

fs.writeFileSync('src/pages/PengeluaranPage.tsx', code);
