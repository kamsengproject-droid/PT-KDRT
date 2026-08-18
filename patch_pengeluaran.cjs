const fs = require('fs');
let text = fs.readFileSync('src/pages/PengeluaranPage.tsx', 'utf8');

text = text.replace(/import React, \{ useState, useEffect, useMemo \} from 'react';/, "import React, { useState, useEffect, useMemo } from 'react';\nimport { CurrencyInput } from '../components/CurrencyInput';");

const oldType = `  const [formData, setFormData] = useState<{
    date: string;
    description: string;
    category: string;
    amount: number;
    paymentMethod: string;
    scope: ScopeType;
    notes: string;
  }>({`;
const newType = `  const [formData, setFormData] = useState<{
    date: string;
    description: string;
    category: string;
    amount: number | '';
    paymentMethod: string;
    scope: ScopeType;
    notes: string;
  }>({`;
text = text.replace(oldType, newType);

text = text.replace(/amount: 0,/g, "amount: '',");
text = text.replace(/amount: editingExpense\.amount \|\| 0,/g, "amount: editingExpense.amount || '',");
text = text.replace(/amount: formData\.amount,/g, "amount: Number(formData.amount) || 0,");
text = text.replace(/amount: Number\(formData\.amount\),/g, "amount: Number(formData.amount) || 0,");

const oldInput = `<input
                  type="number"
                  min={0}
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 font-bold text-rose-600"
                />`;
const newInput = `<CurrencyInput
                  required
                  value={formData.amount}
                  onChange={(val) => setFormData({ ...formData, amount: val })}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 font-bold text-rose-600"
                />`;
text = text.replace(oldInput, newInput);

fs.writeFileSync('src/pages/PengeluaranPage.tsx', text);
