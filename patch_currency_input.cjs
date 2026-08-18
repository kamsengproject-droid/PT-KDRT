const fs = require('fs');
let text = fs.readFileSync('src/components/CurrencyInput.tsx', 'utf8');

text = text.replace(/interface CurrencyInputProps \{/, "interface CurrencyInputProps {\n  prefix?: string;");
text = text.replace(/disabled = false,/, "disabled = false,\n  prefix = 'Rp',");
text = text.replace(/<span className="absolute left-3 top-1\/2 -translate-y-1\/2 text-zinc-500 font-bold">Rp<\/span>/, "{prefix && <span className=\"absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold\">{prefix}</span>}");
text = text.replace(/className={\`pl-9 \$\{className\}\`}/, "className={`\\${prefix ? 'pl-9' : 'pl-3'} \\${className}`}");

fs.writeFileSync('src/components/CurrencyInput.tsx', text);
