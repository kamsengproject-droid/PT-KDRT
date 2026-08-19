const fs = require('fs');
let text = fs.readFileSync('src/pages/InvestorDashboardPage.tsx', 'utf8');

text = text.replace(
  "const unsubProd = subscribeProducts('SHARING', setProducts);",
  "const unsubProd = subscribeProducts({ scope: 'SHARING' }, setProducts);"
);

text = text.replace(
  "const unsubAcc = subscribeAccounts('SHARING', setAccounts);",
  "const unsubAcc = subscribeAccounts('SHARING', setAccounts);" // wait, I don't know subscribeAccounts signature yet
);

fs.writeFileSync('src/pages/InvestorDashboardPage.tsx', text);
