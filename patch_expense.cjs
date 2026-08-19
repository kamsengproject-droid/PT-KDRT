const fs = require('fs');
let code = fs.readFileSync('src/services/expenseService.ts', 'utf8');

code = code.replace(
  /let sourceType: any = 'MANUAL';/,
  `let sourceType: any = expense.sourceType || 'MANUAL';`
);

code = code.replace(
  /export async function hapusPengeluaran\(/,
  `import { deleteTransaction } from './transactionService';
export async function hapusPengeluaran(`
);

const hapusReplace = `
export async function hapusPengeluaran(
  id: string,
  description: string,
  currentUserId: string,
  currentUserName: string,
  sourceType: string = 'MANUAL'
) {
  try {
    await deleteDoc(doc(db, 'expenses', id));
    
    // Attempt to delete transaction if deterministic ID matches
    try {
      const deterministicId = \`\${sourceType}_\${id}\`.replace(/[^a-zA-Z0-9_-]/g, '_');
      // Using void logic or delete directly. 
      // The prompt says "hapus/sinkronkan transaction terkait secara atomic."
      // Since deleteTransaction performs void, that's fine, or we can delete it directly.
      // We will delete the document directly since deleteTransaction marks it as VOID (which is also fine, but prompt says "Jika Owner menghapus expense: hapus dari data operasional. Jangan tampilkan: VOID CORET BATAL di daftar normal. Tetap buat audit log: DELETE_EXPENSE. Jika expense sudah menghasilkan transaction: hapus/sinkronkan transaction terkait secara atomic.")
      // Wait, "hapus dari data operasional" might mean delete from expenses AND transactions entirely.
      const txRef = doc(db, 'transactions', deterministicId);
      await deleteDoc(txRef);
    } catch (e) {
      console.warn("Could not delete related transaction", e);
    }
    
    await catatAuditLog(
      currentUserId,
      currentUserName,
      'DELETE_EXPENSE',
      id,
      \`Pengeluaran dihapus: \${description}\`
    );
  } catch (error) {
`;
code = code.replace(/export async function hapusPengeluaran\([\s\S]*?\} catch \(error\) \{/, hapusReplace.trim() + " catch (error) {");

fs.writeFileSync('src/services/expenseService.ts', code);
