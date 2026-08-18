const fs = require('fs');
let text = fs.readFileSync('src/pages/DatabaseSampelPage.tsx', 'utf8');

text = text.replace(/import React, \{ useState, useEffect, useMemo \} from 'react';/, "import React, { useState, useEffect, useMemo } from 'react';\nimport { CurrencyInput } from '../components/CurrencyInput';");

// Update productFormData type
text = text.replace(/productPrice: number;/, "productPrice: number | '';");
text = text.replace(/commissionRate: number;/, "commissionRate: number | '';");
// Update productFormData initialization
text = text.replace(/productPrice: 0,/, "productPrice: '',");
text = text.replace(/commissionRate: 0,/, "commissionRate: '',");

// Update product edit initialization
text = text.replace(/productPrice: prod\.productPrice \|\| 0,/, "productPrice: prod.productPrice || '',");
text = text.replace(/commissionRate: prod\.commissionRate \|\| 0,/, "commissionRate: prod.commissionRate || '',");

// Update handle submit product
text = text.replace(/await updateProduct\(editingProduct\.id, editingProduct, productFormData, null, uid, name\);/, "await updateProduct(editingProduct.id, editingProduct, { ...productFormData, productPrice: Number(productFormData.productPrice) || 0, commissionRate: Number(productFormData.commissionRate) || 0 }, null, uid, name);");
text = text.replace(/await createProduct\(productFormData, null, uid, name\);/, "await createProduct({ ...productFormData, productPrice: Number(productFormData.productPrice) || 0, commissionRate: Number(productFormData.commissionRate) || 0 }, null, uid, name);");

// Update sampleFormData type
text = text.replace(/samplePrice: number;/, "samplePrice: number | '';");
text = text.replace(/quantity: number;/, "quantity: number | '';");
text = text.replace(/totalCost: number;/, "totalCost: number | '';");
text = text.replace(/targetContent: number;/, "targetContent: number | '';");

// Update sampleFormData initialization
text = text.replace(/samplePrice: 0,\n    purchaseDate:/g, "samplePrice: '',\n    purchaseDate:");
text = text.replace(/quantity: 1,/g, "quantity: '',");
text = text.replace(/totalCost: 0,/g, "totalCost: '',");
text = text.replace(/targetContent: 3,/g, "targetContent: '',");

// Update sample edit initialization
text = text.replace(/samplePrice: samp\.samplePrice \|\| 0,/g, "samplePrice: samp.samplePrice || '',");
text = text.replace(/quantity: samp\.quantity \|\| 1,/g, "quantity: samp.quantity || '',");
text = text.replace(/totalCost: samp\.totalCost \|\| 0,/g, "totalCost: samp.totalCost || '',");
text = text.replace(/targetContent: samp\.targetContent \|\| 1,/g, "targetContent: samp.targetContent || '',");

// Update handle submit sample
text = text.replace(/await updateSample\(editingSample\.id, editingSample, sampleFormData, uid, name\);/, "await updateSample(editingSample.id, editingSample, { ...sampleFormData, samplePrice: Number(sampleFormData.samplePrice) || 0, quantity: Number(sampleFormData.quantity) || 1, totalCost: Number(sampleFormData.totalCost) || 0, targetContent: Number(sampleFormData.targetContent) || 1 }, uid, name);");
text = text.replace(/await createSample\(sampleFormData, uid, name\);/, "await createSample({ ...sampleFormData, samplePrice: Number(sampleFormData.samplePrice) || 0, quantity: Number(sampleFormData.quantity) || 1, totalCost: Number(sampleFormData.totalCost) || 0, targetContent: Number(sampleFormData.targetContent) || 1 }, uid, name);");

// update inputs
const pPriceOld = `<input
                      type="number"
                      min={0}
                      value={productFormData.productPrice}
                      onChange={(e) => setProductFormData({ ...productFormData, productPrice: Number(e.target.value) })}
                      className="w-full rounded-xl border border-zinc-300 p-2.5 font-bold"
                    />`;
const pPriceNew = `<CurrencyInput
                      value={productFormData.productPrice}
                      onChange={(val) => setProductFormData({ ...productFormData, productPrice: val })}
                      className="w-full rounded-xl border border-zinc-300 p-2.5 font-bold"
                    />`;
text = text.replace(pPriceOld, pPriceNew);

const pCommOld = `<input
                      type="number"
                      min={0}
                      max={100}
                      value={productFormData.commissionRate}
                      onChange={(e) => setProductFormData({ ...productFormData, commissionRate: Number(e.target.value) })}
                      className="w-full rounded-xl border border-zinc-300 p-2.5 font-bold text-indigo-700"
                    />`;
const pCommNew = `<CurrencyInput
                      prefix=""
                      value={productFormData.commissionRate}
                      onChange={(val) => setProductFormData({ ...productFormData, commissionRate: val })}
                      className="w-full rounded-xl border border-zinc-300 p-2.5 font-bold text-indigo-700"
                    />`;
text = text.replace(pCommOld, pCommNew);

const sPriceOld = `<input
                      type="number"
                      min={0}
                      value={sampleFormData.samplePrice}
                      onChange={(e) => {
                        const price = Number(e.target.value);
                        setSampleFormData({
                          ...sampleFormData,
                          samplePrice: price,
                          totalCost: price * (sampleFormData.quantity || 1),
                        });
                      }}
                      className="w-full rounded-xl border border-zinc-300 p-2 font-bold"
                    />`;
const sPriceNew = `<CurrencyInput
                      value={sampleFormData.samplePrice}
                      onChange={(val) => {
                        const price = Number(val) || 0;
                        setSampleFormData({
                          ...sampleFormData,
                          samplePrice: val,
                          totalCost: price * (Number(sampleFormData.quantity) || 1),
                        });
                      }}
                      className="w-full rounded-xl border border-zinc-300 p-2 font-bold"
                    />`;
text = text.replace(sPriceOld, sPriceNew);

const sQtyOld = `<input
                    type="number"
                    min={1}
                    value={sampleFormData.quantity}
                    onChange={(e) => {
                      const qty = Math.max(1, Number(e.target.value));
                      setSampleFormData({
                        ...sampleFormData,
                        quantity: qty,
                        totalCost: (sampleFormData.samplePrice || 0) * qty,
                      });
                    }}
                    className="w-full rounded-xl border border-zinc-300 p-2 font-bold text-center"
                  />`;
const sQtyNew = `<CurrencyInput
                    prefix=""
                    value={sampleFormData.quantity}
                    onChange={(val) => {
                      const qty = Math.max(1, Number(val) || 1);
                      setSampleFormData({
                        ...sampleFormData,
                        quantity: val,
                        totalCost: (Number(sampleFormData.samplePrice) || 0) * qty,
                      });
                    }}
                    className="w-full rounded-xl border border-zinc-300 p-2 font-bold text-center"
                  />`;
text = text.replace(sQtyOld, sQtyNew);

const sTotalOld = `<input
                      type="number"
                      min={0}
                      value={sampleFormData.totalCost}
                      onChange={(e) => setSampleFormData({ ...sampleFormData, totalCost: Number(e.target.value) })}
                      className="w-full rounded-xl border border-zinc-300 p-2 font-black text-rose-700"
                    />`;
const sTotalNew = `<CurrencyInput
                      value={sampleFormData.totalCost}
                      onChange={(val) => setSampleFormData({ ...sampleFormData, totalCost: val })}
                      className="w-full rounded-xl border border-zinc-300 p-2 font-black text-rose-700"
                    />`;
text = text.replace(sTotalOld, sTotalNew);

const sTargetOld = `<input
                    type="number"
                    min={1}
                    value={sampleFormData.targetContent}
                    onChange={(e) => setSampleFormData({ ...sampleFormData, targetContent: Number(e.target.value) })}
                    className="w-full rounded-xl border border-zinc-300 p-2 font-bold text-orange-700"
                  />`;
const sTargetNew = `<CurrencyInput
                    prefix=""
                    value={sampleFormData.targetContent}
                    onChange={(val) => setSampleFormData({ ...sampleFormData, targetContent: val })}
                    className="w-full rounded-xl border border-zinc-300 p-2 font-bold text-orange-700"
                  />`;
text = text.replace(sTargetOld, sTargetNew);

fs.writeFileSync('src/pages/DatabaseSampelPage.tsx', text);
