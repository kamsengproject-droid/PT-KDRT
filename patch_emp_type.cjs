const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

const newProps = `  photoUrl?: string;
  permissions?: {
    canViewAttendance?: boolean;
    canManageOwnProfile?: boolean;
    canChangeOwnPassword?: boolean;
    canViewSampleProducts?: boolean;
    canCreateSampleProduct?: boolean;
    canInputCommissionReal?: boolean;
    canViewOmset?: boolean;
    canViewSharingOmset?: boolean;
    canViewSpecificAccounts?: string[];
  };`;
code = code.replace(/  photoUrl\?: string;/, newProps);

fs.writeFileSync('src/types.ts', code);
