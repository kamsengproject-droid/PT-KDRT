const fs = require('fs');
let text = fs.readFileSync('src/pages/PerformaHarianPage.tsx', 'utf8');

text = text.replace(/import React, \{ useState, useEffect, useMemo \} from 'react';/, "import React, { useState, useEffect, useMemo } from 'react';\nimport { CurrencyInput } from '../components/CurrencyInput';");

const oldState = `  const [formData, setFormData] = useState<{
    date: string;
    accountId: string;
    accountName: string;
    scope: ScopeType;
    gmv: number;
    estimatedCommission: number;
    realCommission: number;
    notes: string;
  }>({
    date: tanggalHariIni(),
    accountId: '',
    accountName: '',
    scope: 'SHARING',
    gmv: 0,
    estimatedCommission: 0,
    realCommission: 0,
    notes: '',
  });`;

const newState = `  const [formData, setFormData] = useState<{
    date: string;
    accountId: string;
    accountName: string;
    scope: ScopeType;
    gmv: number | '';
    estimatedCommission: number | '';
    realCommission: number | '';
    notes: string;
  }>({
    date: tanggalHariIni(),
    accountId: '',
    accountName: '',
    scope: 'SHARING',
    gmv: '',
    estimatedCommission: '',
    realCommission: '',
    notes: '',
  });`;

text = text.replace(oldState, newState);

// fix save/edit functions
text = text.replace(/gmv: formData\.gmv,/, "gmv: Number(formData.gmv) || 0,");
text = text.replace(/estimatedCommission: formData\.estimatedCommission,/, "estimatedCommission: Number(formData.estimatedCommission) || 0,");
text = text.replace(/realCommission: formData\.realCommission,/, "realCommission: Number(formData.realCommission) || 0,");

text = text.replace(/gmv: performance\.gmv || 0,/, "gmv: performance.gmv || '',");
text = text.replace(/estimatedCommission: performance\.estimatedCommission || 0,/, "estimatedCommission: performance.estimatedCommission || '',");
text = text.replace(/realCommission: performance\.realCommission || 0,/, "realCommission: performance.realCommission || '',");

// fix inputs
const oldGmvInput = `<input
                    type="number"
                    min={0}
                    required
                    value={formData.gmv}
                    onChange={(e) => setFormData({ ...formData, gmv: Number(e.target.value) })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 font-bold"
                  />`;
const newGmvInput = `<CurrencyInput
                    required
                    value={formData.gmv}
                    onChange={(val) => setFormData({ ...formData, gmv: val })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 font-bold"
                  />`;
text = text.replace(oldGmvInput, newGmvInput);

const oldEstInput = `<input
                    type="number"
                    min={0}
                    value={formData.estimatedCommission}
                    onChange={(e) => setFormData({ ...formData, estimatedCommission: Number(e.target.value) })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 font-medium"
                  />`;
const newEstInput = `<CurrencyInput
                    value={formData.estimatedCommission}
                    onChange={(val) => setFormData({ ...formData, estimatedCommission: val })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 font-medium"
                  />`;
text = text.replace(oldEstInput, newEstInput);

const oldRealInput = `<input
                    type="number"
                    min={0}
                    required
                    value={formData.realCommission}
                    onChange={(e) => setFormData({ ...formData, realCommission: Number(e.target.value) })}
                    className="w-full rounded-xl border-2 border-emerald-400 bg-emerald-50/40 p-2.5 font-black text-emerald-800"
                  />`;
const newRealInput = `<CurrencyInput
                    required
                    value={formData.realCommission}
                    onChange={(val) => setFormData({ ...formData, realCommission: val })}
                    className="w-full rounded-xl border-2 border-emerald-400 bg-emerald-50/40 p-2.5 font-black text-emerald-800"
                  />`;
text = text.replace(oldRealInput, newRealInput);

fs.writeFileSync('src/pages/PerformaHarianPage.tsx', text);
