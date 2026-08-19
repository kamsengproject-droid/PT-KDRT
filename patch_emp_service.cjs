const fs = require('fs');
let code = fs.readFileSync('src/services/employeeService.ts', 'utf8');

const replacement = `export async function getEmployeeByUserId(userId: string): Promise<Employee | null> {
  try {
    const q = query(collection(db, 'employees'), where('userId', '==', userId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const emp = { id: snap.docs[0].id, ...snap.docs[0].data() } as Employee;
      
      // Inject hardcoded granular permissions based on name if not set
      if (!emp.permissions) {
        if (emp.name === 'Desta') {
          emp.permissions = {
            canViewAttendance: true,
            canManageOwnProfile: true,
            canChangeOwnPassword: true,
            canViewSampleProducts: true,
            canCreateSampleProduct: false,
            canInputCommissionReal: true,
            canViewOmset: true,
            canViewSharingOmset: true,
            canViewSpecificAccounts: ['NISAGROSIR88']
          };
        } else if (emp.name === 'Melinda Putri') {
          emp.permissions = {
            canViewAttendance: true,
            canManageOwnProfile: true,
            canChangeOwnPassword: true,
            canViewSampleProducts: true,
            canCreateSampleProduct: true,
            canInputCommissionReal: false,
            canViewOmset: false,
            canViewSharingOmset: false,
            canViewSpecificAccounts: []
          };
        } else {
          // default safe employee
          emp.permissions = {
            canViewAttendance: true,
            canManageOwnProfile: true,
            canChangeOwnPassword: true,
            canViewSampleProducts: true,
            canCreateSampleProduct: false,
            canInputCommissionReal: false,
            canViewOmset: false,
            canViewSharingOmset: false,
            canViewSpecificAccounts: []
          };
        }
      }
      return emp;
    }
    return null;
  } catch (err) {`;

code = code.replace(/export async function getEmployeeByUserId\([\s\S]*?\} catch \(err\) \{/, replacement);
fs.writeFileSync('src/services/employeeService.ts', code);
