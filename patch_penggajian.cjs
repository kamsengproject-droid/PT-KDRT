const fs = require('fs');
let text = fs.readFileSync('src/pages/PenggajianPage.tsx', 'utf8');

text = text.replace(/import React, \{ useState, useEffect, useMemo \} from 'react';/, "import React, { useState, useEffect, useMemo } from 'react';\nimport { CurrencyInput } from '../components/CurrencyInput';");

text = text.replace(/const \[bonusInput, setBonusInput\] = useState<number>\(0\);/, "const [bonusInput, setBonusInput] = useState<number | ''>('');");
text = text.replace(/const \[deductionInput, setDeductionInput\] = useState<number>\(0\);/, "const [deductionInput, setDeductionInput] = useState<number | ''>('');");
text = text.replace(/const \[additionInput, setAdditionInput\] = useState<number>\(0\);/, "const [additionInput, setAdditionInput] = useState<number | ''>('');");

text = text.replace(/amount: bonusInput,/g, "amount: Number(bonusInput) || 0,");
text = text.replace(/amount: deductionInput,/g, "amount: Number(deductionInput) || 0,");
text = text.replace(/amount: additionInput,/g, "amount: Number(additionInput) || 0,");

text = text.replace(/setBonusInput\(0\);/g, "setBonusInput('');");
text = text.replace(/setDeductionInput\(0\);/g, "setDeductionInput('');");
text = text.replace(/setAdditionInput\(0\);/g, "setAdditionInput('');");

const oldBonusInput = `<input
                  type="number"
                  min={0}
                  step={50000}
                  value={bonusInput}
                  onChange={(e) => setBonusInput(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 font-bold text-zinc-900 focus:outline-emerald-600"
                />`;
const newBonusInput = `<CurrencyInput
                  value={bonusInput}
                  onChange={(val) => setBonusInput(val)}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 font-bold text-zinc-900 focus:outline-emerald-600"
                />`;
text = text.replace(oldBonusInput, newBonusInput);

const oldAdditionInput = `<input
                  type="number"
                  min={0}
                  step={50000}
                  value={additionInput}
                  onChange={(e) => setAdditionInput(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 font-bold text-emerald-700 focus:outline-emerald-600"
                />`;
const newAdditionInput = `<CurrencyInput
                  value={additionInput}
                  onChange={(val) => setAdditionInput(val)}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 font-bold text-emerald-700 focus:outline-emerald-600"
                />`;
text = text.replace(oldAdditionInput, newAdditionInput);

const oldDeductionInput = `<input
                  type="number"
                  min={0}
                  step={50000}
                  value={deductionInput}
                  onChange={(e) => setDeductionInput(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 font-bold text-rose-700 focus:outline-rose-600"
                />`;
const newDeductionInput = `<CurrencyInput
                  value={deductionInput}
                  onChange={(val) => setDeductionInput(val)}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 font-bold text-rose-700 focus:outline-rose-600"
                />`;
text = text.replace(oldDeductionInput, newDeductionInput);

fs.writeFileSync('src/pages/PenggajianPage.tsx', text);
