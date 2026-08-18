const fs = require('fs');
let text = fs.readFileSync('src/pages/ArusKasPage.tsx', 'utf8');

if (text.includes("saldoKasBersih")) {
  console.log("Found");
} else {
  console.log("Not found");
}
