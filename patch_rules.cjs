const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

const employeeUpdateRule = `
      allow create, delete: if isOwner() || isManager();
      allow update: if isOwner() || isManager() || 
        (isEmployee() && resource.data.userId == request.auth.uid &&
         request.resource.data.baseSalary == resource.data.baseSalary &&
         request.resource.data.appRole == resource.data.appRole &&
         request.resource.data.userId == resource.data.userId &&
         request.resource.data.active == resource.data.active &&
         request.resource.data.position == resource.data.position &&
         request.resource.data.permissions == resource.data.permissions
        );
`;

code = code.replace(/allow write: if isOwner\(\) \|\| isManager\(\);/, employeeUpdateRule.trim());

fs.writeFileSync('firestore.rules', code);
