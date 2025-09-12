// server/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
// Node 18+면 global fetch 사용 가능. Render 기본 런타임 18/20이므로 node-fetch 불필요.
// import fetch from 'node-fetch';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 3001;
const NEWS_KEY = process.env.NEWS_KEY;

// ---------- CORS ----------
const allowList = String(process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    // 서버-서버/헬스체크 등 Origin 없는 요청 허용
    if (!origin) return cb(null, true);
    if (allowList.length === 0 || allowList.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());

// ---------- Health ----------
app.get('/health', (_req, res) => res.status(200).send('OK'));       // Render Health Check Path
app.get('/api/health', (_req, res) => res.json({ ok: true }));       // 선택용(사용 안 해도 됨)

// ---------- /api/news (단일 + 캐시) ----------
const CACHE_TTL_MS = 30 * 60 * 1000; // 30분
const cache = new Map(); // key -> { t, data }
const cacheKey = (params) =>
  crypto.createHash('md5').update(JSON.stringify(params)).digest('hex');

app.get('/api/news', async (req, res) => {
  try {
    // ---- 파라미터 정리/가드 ----
    let q = String(req.query.q || 'interior design').slice(0, 480);
    const lang = String(req.query.lang || '');
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '10', 10), 1), 100);
    const fromDays = Math.max(parseInt(req.query.fromDays || '14', 10), 0);
    const searchIn = req.query.searchIn ? String(req.query.searchIn) : 'title,description';

    const key = cacheKey({ q, lang, pageSize, fromDays, searchIn });
    const hit = cache.get(key);
    if (hit && Date.now() - hit.t < CACHE_TTL_MS) {
      return res.json(hit.data);
    }

    const from = new Date();
    if (fromDays > 0) from.setDate(from.getDate() - fromDays);

    const url = new URL('https://newsapi.org/v2/everything');
    url.searchParams.set('q', q);
    url.searchParams.set('searchIn', searchIn);
    url.searchParams.set('sortBy', 'publishedAt');
    url.searchParams.set('pageSize', String(pageSize));
    if (fromDays > 0) url.searchParams.set('from', from.toISOString());
    if (lang) url.searchParams.set('language', lang);

    const r = await fetch(url.toString(), {
      headers: { 'X-Api-Key': NEWS_KEY }
    });
    const data = await r.json();

    if (r.ok && data?.status === 'ok') {
      cache.set(key, { t: Date.now(), data });
      return res.status(200).json(data);
    }
    return res.status(500).json(data);
  } catch (e) {
    return res.status(500).json({ status: 'error', message: e.message });
  }
});

// ---------- 루트 ----------
app.get('/', (_req, res) => {
  res.type('text/plain').send(
    'Souvenir news proxy is running.\n' +
    'Try: /health  or  /api/news?q=interior&lang=ko&fromDays=30'
  );
});

app.listen(PORT, () => {
  console.log(`proxy on :${PORT}`);
});

