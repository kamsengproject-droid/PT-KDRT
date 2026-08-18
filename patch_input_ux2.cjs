const fs = require('fs');
let text = fs.readFileSync('src/components/CurrencyInput.tsx', 'utf8');

const search = `    if (val === '' || val === '0') {
      setDisplayValue('');
      onChange('');
    } else {
      const num = parseInt(val, 10);
      setDisplayValue(num.toLocaleString('id-ID'));
      onChange(num);
    }`;

const replace = `    // Strip out leading zeros
    val = val.replace(/^0+/, '');

    if (val === '') {
      setDisplayValue('');
      onChange('');
    } else {
      const num = parseInt(val, 10);
      setDisplayValue(num.toLocaleString('id-ID'));
      onChange(num);
    }`;

text = text.replace(search, replace);
fs.writeFileSync('src/components/CurrencyInput.tsx', text);
