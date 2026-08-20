import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy for accurate public client IP behind reverse proxy / Cloud Run / Vercel
  app.set('trust proxy', true);

  // JSON Body Parser for base64 images
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Helper to extract client public IP from proxy headers or socket
  function extractClientIp(req: express.Request): string {
    const forwardedFor = req.headers['x-forwarded-for'];
    let rawIp = '';

    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
      // Left-most IP is the original client IP
      rawIp = forwardedFor.split(',')[0].trim();
    } else if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
      rawIp = String(forwardedFor[0]).split(',')[0].trim();
    } else if (typeof req.headers['x-real-ip'] === 'string' && req.headers['x-real-ip'].trim()) {
      rawIp = req.headers['x-real-ip'].trim();
    } else if (typeof req.headers['cf-connecting-ip'] === 'string' && req.headers['cf-connecting-ip'].trim()) {
      rawIp = req.headers['cf-connecting-ip'].trim();
    } else if (typeof req.headers['x-client-ip'] === 'string' && req.headers['x-client-ip'].trim()) {
      rawIp = req.headers['x-client-ip'].trim();
    } else if (typeof req.headers['fastly-client-ip'] === 'string' && req.headers['fastly-client-ip'].trim()) {
      rawIp = req.headers['fastly-client-ip'].trim();
    } else if (typeof req.headers['true-client-ip'] === 'string' && req.headers['true-client-ip'].trim()) {
      rawIp = req.headers['true-client-ip'].trim();
    } else if (req.ip) {
      rawIp = req.ip.trim();
    } else if (req.socket?.remoteAddress) {
      rawIp = req.socket.remoteAddress.trim();
    }

    // Normalize IPv6-mapped IPv4 e.g. ::ffff:158.140.166.38 -> 158.140.166.38
    if (rawIp.startsWith('::ffff:')) {
      rawIp = rawIp.slice(7);
    }

    return rawIp;
  }

  function getAllowedOfficeIps(): string[] {
    const envIps = process.env.OFFICE_PUBLIC_IPS || '158.140.166.38';
    return envIps
      .split(',')
      .map((ip) => ip.trim())
      .filter((ip) => ip.length > 0);
  }

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // =========================================================================
  // API: NETWORK VERIFICATION FOR ROLE ACCESS CONTROL
  // =========================================================================
  app.post('/api/auth/verify-network', (req, res) => {
    try {
      const { uid, role } = req.body || {};
      const normalizedRole = String(role || '').toUpperCase();
      const requestPublicIp = extractClientIp(req);
      const allowedOfficeIps = getAllowedOfficeIps();

      let allowed = false;

      // 1. OWNER and INVESTOR can login from anywhere
      if (normalizedRole === 'OWNER' || normalizedRole === 'INVESTOR') {
        allowed = true;
      }
      // 2. EMPLOYEE & MANAGER must originate from office public IP
      else if (normalizedRole === 'EMPLOYEE' || normalizedRole === 'MANAGER') {
        allowed = allowedOfficeIps.includes(requestPublicIp);
      }
      // 3. Fallback for undefined/unknown roles: require office network
      else {
        allowed = allowedOfficeIps.includes(requestPublicIp);
      }

      // Temporary server-side diagnostic logging (Requirement 15)
      console.log('[LOGIN_NETWORK_CHECK]', {
        role: normalizedRole,
        uid: uid || 'anonymous',
        requestPublicIp: requestPublicIp || 'unknown',
        allowed: allowed,
      });

      if (!allowed) {
        return res.status(403).json({
          allowed: false,
          code: 'OFFICE_NETWORK_REQUIRED',
          message: 'Login karyawan hanya dapat dilakukan melalui jaringan kantor.',
        });
      }

      return res.json({
        allowed: true,
        message: 'Network access granted.',
      });
    } catch (err: any) {
      console.error('Error in /api/auth/verify-network:', err);
      return res.status(500).json({
        allowed: false,
        code: 'NETWORK_VERIFICATION_ERROR',
        message: 'Gagal memverifikasi jaringan.',
      });
    }
  });

  // Lazy initialize Gemini client
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is missing.');
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return aiClient;
  }

  // =========================================================================
  // API: SCAN SCREENSHOT PRODUK DARI MARKETPLACE (TIKTOK SHOP / SHOPEE)
  // =========================================================================
  const scanProductHandler = async (req: express.Request, res: express.Response) => {
    try {
      const { imageBase64, mimeType } = req.body;

      if (!imageBase64) {
        return res.status(400).json({
          success: false,
          error: 'Gambar screenshot (imageBase64) wajib disertakan.',
        });
      }

      // Clean base64 string if data URL prefix exists
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
      const validMimeType = mimeType || 'image/jpeg';

      const ai = getGeminiClient();

      const prompt = `Anda adalah asisten AI khusus membaca screenshot produk marketplace (TikTok Shop, Shopee, Tokopedia, dll).
Tugas Anda: Analisis screenshot produk ini secara teliti dan ekstrak informasinya ke dalam format JSON yang valid.

Aturan Ekstraksi:
1. "productName": Nama atau judul lengkap produk yang tertera di screenshot. Bersihkan dari karakter aneh yang tidak relevan.
2. "productPrice": Harga jual produk dalam angka murni integer (contoh: jika Rp54.450 atau 54.450 -> 54450. Jika tidak terbaca -> 0).
3. "platform": Platform marketplace yang terdeteksi ("TikTok" untuk TikTok Shop, "Shopee" untuk Shopee, atau "MANUAL" jika tidak yakin).
4. "category": Perkiraan kategori produk (pilih satu yang paling cocok dari: "Skincare & Kecantikan", "Fashion & Pakaian", "Mainan & Hobi", "Baju Anak & Bayi", "Elektronik & Gadget", "Rumah Tangga & Dapur", "Otomotif & Aksesoris", "Makanan & Minuman", "Kesehatan & Kebugaran", atau "Lainnya").
5. "aiRecommendation": Jika terdapat badge atau ranking (misal "Top selling #1", "Best Seller", "Paling Laris #1", "Mall", "Star+"), tuliskan (contoh: "TOP SELLING #1"). Jika tidak ada badge khusus, isi string kosong "".
6. "earningInfo": Jika ada informasi perkiraan penghasilan komisi di screenshot kreator (contoh: "Earn Rp5.445", "Estimasi Komisi Rp5.000"), tuliskan teks aslinya sebagai informasi pembacaan. JANGAN jadikan ini sebagai komisi real. Jika tidak ada, isi "".
7. "variantOrSize": Jika tertera varian / ukuran / warna yang dipilih di screenshot (contoh: "Hitam, Size L"), tuliskan. Jika tidak ada, isi "".
8. "notes": Ringkasan singkat fitur atau catatan penting dari produk.
9. "productImageBoundingBox": Cari koordinat area gambar/foto produk utama dalam screenshot dalam format box_2d [ymin, xmin, ymax, xmax] dengan skala 0 hingga 1000. Jika foto produk utama jelas, berikan koordinatnya agar bisa dicrop. Jika tidak jelas atau penuh, isi null.
10. "confidence": Tingkat keyakinan pembacaan ("HIGH", "MEDIUM", atau "LOW") untuk masing-masing field ("productName", "productPrice", "platform").

Format output WAJIB HANYA JSON murni strictly valid sesuai schema:
{
  "productName": "string",
  "productPrice": 0,
  "platform": "TikTok" | "Shopee" | "MANUAL",
  "category": "string",
  "aiRecommendation": "string",
  "earningInfo": "string",
  "variantOrSize": "string",
  "notes": "string",
  "productImageBoundingBox": {
    "box_2d": [0, 0, 0, 0]
  } | null,
  "confidence": {
    "productName": "HIGH" | "MEDIUM" | "LOW",
    "productPrice": "HIGH" | "MEDIUM" | "LOW",
    "platform": "HIGH" | "MEDIUM" | "LOW"
  }
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            inlineData: {
              mimeType: validMimeType,
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '{}';
      let parsedData: any = {};

      try {
        parsedData = JSON.parse(responseText);
      } catch (parseErr) {
        console.error('Error parsing Gemini response as JSON:', parseErr, responseText);
        // Fallback sanitize
        const match = responseText.match(/\{[\s\S]*\}/);
        if (match) {
          parsedData = JSON.parse(match[0]);
        } else {
          throw new Error('Format hasil AI tidak valid.');
        }
      }

      return res.json({
        success: true,
        data: {
          productName: parsedData.productName || '',
          productPrice: typeof parsedData.productPrice === 'number' ? parsedData.productPrice : (parseInt(String(parsedData.productPrice).replace(/\D/g, ''), 10) || 0),
          platform: parsedData.platform || 'MANUAL',
          category: parsedData.category || 'Skincare & Kecantikan',
          aiRecommendation: parsedData.aiRecommendation || '',
          earningInfo: parsedData.earningInfo || '',
          variantOrSize: parsedData.variantOrSize || '',
          notes: parsedData.notes || '',
          productImageBoundingBox: parsedData.productImageBoundingBox || null,
          confidence: parsedData.confidence || {
            productName: 'MEDIUM',
            productPrice: 'MEDIUM',
            platform: 'MEDIUM',
          },
        },
      });
    } catch (err: any) {
      console.error('Error scanning screenshot:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Gagal memproses screenshot dengan AI.',
      });
    }
  };

  app.post('/api/scan-product', scanProductHandler);
  app.post('/api/scan-product-image', scanProductHandler);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server PT.KDRT running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
