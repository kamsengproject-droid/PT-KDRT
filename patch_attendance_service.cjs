const fs = require('fs');
let code = fs.readFileSync('src/services/attendanceService.ts', 'utf8');

// Fix lakukanAbsenMasuk
code = code.replace(
  /const recordData: Omit<AttendanceRecord, 'id'> = {/,
  `const recordData: Omit<AttendanceRecord, 'id'> = {
    userId: currentUserId,`
);

// Fix lakukanAbsenPulang
code = code.replace(
  /const recordData: Omit<AttendanceRecord, 'id'> = {/,
  `const recordData: Omit<AttendanceRecord, 'id'> = {
    userId: currentUserId,`
); // Note: Since the replace is global or first match, we need a better regex.

fs.writeFileSync('src/services/attendanceService.ts', code);
