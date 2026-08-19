const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

const employeeUpdateRule = `
      allow create, delete: if isOwner() || isManager();
      allow update: if isOwner() || isManager() || 
        (isEmployee() && resource.data.userId == request.auth.uid &&
         request.resource.data.get('baseSalary', 0) == resource.data.get('baseSalary', 0) &&
         request.resource.data.get('appRole', '') == resource.data.get('appRole', '') &&
         request.resource.data.get('userId', '') == resource.data.get('userId', '') &&
         request.resource.data.get('active', false) == resource.data.get('active', false) &&
         request.resource.data.get('position', '') == resource.data.get('position', '') &&
         request.resource.data.get('permissions', null) == resource.data.get('permissions', null)
        );
`;

code = code.replace(/allow update: if isOwner\(\) \|\| isManager\(\) \|\|[\s\S]*?request\.resource\.data\.permissions == resource\.data\.permissions\n\s*\);/, employeeUpdateRule.trim());

fs.writeFileSync('firestore.rules', code);
