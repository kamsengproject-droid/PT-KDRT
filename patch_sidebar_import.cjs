const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

code = code.replace(/import \{ useAuth \} from '\.\.\/context\/AuthContext';/, "import { useAuth } from '../context/AuthContext';\nimport { ChangePasswordModal } from './ChangePasswordModal';");

code = code.replace(/<\/aside>\n\s*<\/>/, "  <ChangePasswordModal />\n      </aside>\n    </>");

fs.writeFileSync('src/components/Sidebar.tsx', code);
