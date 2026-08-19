const fs = require('fs');
let text = fs.readFileSync('src/services/transactionService.ts', 'utf8');

// replace voidTransaction with deleteTransaction
const voidRegex = /export async function voidTransaction\([\s\S]*?\} catch \(error\) \{[\s\S]*?\}\s*\}/;

const deleteCode = `export async function deleteTransaction(
  transactionId: string,
  currentTransaction: FinancialTransaction,
  deleteReason: string,
  currentUserId: string,
  currentUserName: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (!deleteReason || deleteReason.trim().length === 0) {
      throw new Error('Alasan penghapusan wajib diisi untuk audit trail.');
    }

    const docRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);

    // Hard delete
    await deleteDoc(docRef);

    await catatAuditLog(
      currentUserId,
      currentUserName,
      'DELETE_TRANSACTION',
      \`[HAPUS] \${currentTransaction.type} - Rp \${currentTransaction.amount.toLocaleString('id-ID')}\`,
      \`Transaksi ID: \${transactionId}, Kategori: \${currentTransaction.category}, Alasan HAPUS: \${deleteReason.trim()}\`,
      currentTransaction, // Before state
      null // After state
    );

    return {
      success: true,
      message: \`Transaksi berhasil dihapus dari sistem. Audit log telah dicatat.\`,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, \`\${TRANSACTIONS_COLLECTION}/\${transactionId}\`);
    throw error;
  }
}`;

text = text.replace(voidRegex, deleteCode);

// Ensure deleteDoc is imported
if (!text.includes('deleteDoc')) {
  text = text.replace(/updateDoc,/, 'updateDoc, deleteDoc,');
}

fs.writeFileSync('src/services/transactionService.ts', text);
