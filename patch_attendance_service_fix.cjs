const fs = require('fs');
let code = fs.readFileSync('src/services/attendanceService.ts', 'utf8');

code = code.replace(/userId: currentUserId,\n    userId: currentUserId,/g, 'userId: currentUserId,');

// Check if lakukanAbsenPulang has it.
if (!code.split('export async function lakukanAbsenPulang')[1].includes('userId: currentUserId,')) {
    let parts = code.split('export async function lakukanAbsenPulang');
    parts[1] = parts[1].replace(/const recordData: Omit<AttendanceRecord, 'id'> = \{/, `const recordData: Omit<AttendanceRecord, 'id'> = {
    userId: currentUserId,`);
    code = parts.join('export async function lakukanAbsenPulang');
}

fs.writeFileSync('src/services/attendanceService.ts', code);
