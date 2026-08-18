const fs = require('fs');
let text = fs.readFileSync('src/pages/KaryawanPage.tsx', 'utf8');

text = text.replace(/import React, \{ useState, useEffect, useRef \} from 'react';/, "import React, { useState, useEffect, useRef } from 'react';\nimport { CurrencyInput } from '../components/CurrencyInput';");

text = text.replace(/baseSalary: number;/, "baseSalary: number | '';");
text = text.replace(/baseSalary: 0,/, "baseSalary: '',");
text = text.replace(/baseSalary: selectedEmployee\.baseSalary \|\| 0,/, "baseSalary: selectedEmployee.baseSalary || '',");
text = text.replace(/baseSalary: Number\(formData\.baseSalary\) \|\| 0,/, "baseSalary: Number(formData.baseSalary) || 0,");
text = text.replace(/baseSalary: formData\.baseSalary,/, "baseSalary: Number(formData.baseSalary) || 0,");

const oldBaseInput = `<input
                    type="number"
                    required
                    min={0}
                    step={50000}
                    value={formData.baseSalary}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        baseSalary: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-zinc-300 p-2.5 font-bold"
                  />`;
const newBaseInput = `<CurrencyInput
                    required
                    value={formData.baseSalary}
                    onChange={(val) =>
                      setFormData({
                        ...formData,
                        baseSalary: val,
                      })
                    }
                    className="w-full rounded-xl border border-zinc-300 p-2.5 font-bold"
                  />`;
text = text.replace(oldBaseInput, newBaseInput);

fs.writeFileSync('src/pages/KaryawanPage.tsx', text);
