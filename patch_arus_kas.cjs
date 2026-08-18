const fs = require('fs');
let text = fs.readFileSync('src/pages/ArusKasPage.tsx', 'utf8');

text = text.replace(/import React, \{ useState, useEffect, useMemo \} from 'react';/, "import React, { useState, useEffect, useMemo } from 'react';\nimport { CurrencyInput } from '../components/CurrencyInput';");

// Update form types
text = text.replace(/gmv\?: number;/, "gmv?: number | '';");
text = text.replace(/estimatedCommission\?: number;/, "estimatedCommission?: number | '';");
text = text.replace(/realCommission\?: number;/, "realCommission?: number | '';");
text = text.replace(/amount: number;/, "amount: number | '';");
text = text.replace(/amount: 0,/g, "amount: '',");
text = text.replace(/gmv: 0,/g, "gmv: '',");
text = text.replace(/estimatedCommission: 0,/g, "estimatedCommission: '',");
text = text.replace(/realCommission: 0,/g, "realCommission: '',");

// Update submit functions
text = text.replace(/amount: incomeForm\.amount,/g, "amount: Number(incomeForm.amount) || 0,");
text = text.replace(/amount: incomeForm\.realCommission \|\| 0,/g, "amount: Number(incomeForm.realCommission) || 0,");
text = text.replace(/gmv: incomeForm\.gmv,/g, "gmv: Number(incomeForm.gmv) || 0,");
text = text.replace(/estimatedCommission: incomeForm\.estimatedCommission,/g, "estimatedCommission: Number(incomeForm.estimatedCommission) || 0,");
text = text.replace(/realCommission: incomeForm\.realCommission,/g, "realCommission: Number(incomeForm.realCommission) || 0,");
text = text.replace(/amount: expenseForm\.amount,/g, "amount: Number(expenseForm.amount) || 0,");

// Update inputs
const oldGmvInput = `<input
                        type="number"
                        min={0}
                        placeholder="Rp 0"
                        value={incomeForm.gmv}
                        onChange={(e) => setIncomeForm({ ...incomeForm, gmv: Number(e.target.value) })}
                        className="w-full rounded-xl border border-zinc-300 bg-white p-2 font-medium"
                      />`;
const newGmvInput = `<CurrencyInput
                        placeholder="Rp 0"
                        value={incomeForm.gmv || ''}
                        onChange={(val) => setIncomeForm({ ...incomeForm, gmv: val })}
                        className="w-full rounded-xl border border-zinc-300 bg-white p-2 font-medium"
                      />`;
text = text.replace(oldGmvInput, newGmvInput);

const oldEstInput = `<input
                        type="number"
                        min={0}
                        placeholder="Rp 0"
                        value={incomeForm.estimatedCommission}
                        onChange={(e) => setIncomeForm({ ...incomeForm, estimatedCommission: Number(e.target.value) })}
                        className="w-full rounded-xl border border-zinc-300 bg-white p-2 font-medium"
                      />`;
const newEstInput = `<CurrencyInput
                        placeholder="Rp 0"
                        value={incomeForm.estimatedCommission || ''}
                        onChange={(val) => setIncomeForm({ ...incomeForm, estimatedCommission: val })}
                        className="w-full rounded-xl border border-zinc-300 bg-white p-2 font-medium"
                      />`;
text = text.replace(oldEstInput, newEstInput);

const oldRealInput = `<input
                      type="number"
                      min={1}
                      required
                      placeholder="Nominal komisi bersih yang dicairkan"
                      value={incomeForm.realCommission}
                      onChange={(e) => setIncomeForm({ ...incomeForm, realCommission: Number(e.target.value) })}
                      className="w-full rounded-xl border border-emerald-300 bg-emerald-50 p-2 font-black text-emerald-800"
                    />`;
const newRealInput = `<CurrencyInput
                      required
                      placeholder="Nominal komisi bersih yang dicairkan"
                      value={incomeForm.realCommission || ''}
                      onChange={(val) => setIncomeForm({ ...incomeForm, realCommission: val })}
                      className="w-full rounded-xl border border-emerald-300 bg-emerald-50 p-2 font-black text-emerald-800"
                    />`;
text = text.replace(oldRealInput, newRealInput);

const oldAmountInput = `<input
                    type="number"
                    min={1}
                    required
                    value={incomeForm.amount}
                    onChange={(e) => setIncomeForm({ ...incomeForm, amount: Number(e.target.value) })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 font-extrabold text-emerald-700 text-base"
                  />`;
const newAmountInput = `<CurrencyInput
                    required
                    value={incomeForm.amount || ''}
                    onChange={(val) => setIncomeForm({ ...incomeForm, amount: val })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 font-extrabold text-emerald-700 text-base"
                  />`;
text = text.replace(oldAmountInput, newAmountInput);

const oldExpAmountInput = `<input
                  type="number"
                  min={1}
                  required
                  placeholder="Rp 0"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 font-extrabold text-rose-700 text-base"
                />`;
const newExpAmountInput = `<CurrencyInput
                  required
                  placeholder="Rp 0"
                  value={expenseForm.amount || ''}
                  onChange={(val) => setExpenseForm({ ...expenseForm, amount: val })}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 font-extrabold text-rose-700 text-base"
                />`;
text = text.replace(oldExpAmountInput, newExpAmountInput);

fs.writeFileSync('src/pages/ArusKasPage.tsx', text);
