// server/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 3001;
const NEWS_KEY = process.env.NEWS_KEY;

// CORS 허용 도메인
const allowList = String(process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // 서버-서버 요청 허용
    if (allowList.length === 0 || allowList.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  }
}));

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get("/api/news", async (req, res) => {
  try {
    let q = String(req.query.q || "interior design");
    if (q.length > 480) q = q.slice(0, 480); // 안전장치

    const lang = req.query.lang || "";
    const fromDays = parseInt(req.query.fromDays || "0", 10);
    const pageSize = parseInt(req.query.pageSize || "10", 10);

    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("q", q);
    url.searchParams.set("searchIn", "title,description");
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", String(Math.min(Math.max(pageSize, 1), 100)));
    if (lang) url.searchParams.set("language", lang);
    if (fromDays > 0) {
      const from = new Date();
      from.setDate(from.getDate() - fromDays);
      url.searchParams.set("from", from.toISOString());
    }

    const r = await fetch(url.toString(), { headers: { "X-Api-Key": NEWS_KEY } });
    const data = await r.json();
    res.status(r.ok ? 200 : 500).json(data);
  } catch (e) {
    res.status(500).json({ status: "error", message: e.message });
  }
});

// ----- 간단 캐시 (메모리) -----
const CACHE_TTL_MS = 30 * 60 * 1000; // 30분
const cache = new Map(); // key -> { t, data }
const cacheKey = (params) =>
  crypto.createHash('md5').update(JSON.stringify(params)).digest('hex');

app.get('/api/news', async (req, res) => {
  try {
    const q       = String(req.query.q || 'interior design');
    const lang    = String(req.query.lang || '');
    const pageSize= String(req.query.pageSize || '10');
    const searchIn  = req.query.searchIn; 
    const fromDays= Number(req.query.fromDays || 14);

    // 캐시 조회
    const key = cacheKey({ q, lang, pageSize, fromDays });
    const hit = cache.get(key);
    if (hit && (Date.now() - hit.t) < CACHE_TTL_MS) {
      return res.json(hit.data);
    }

    // fromDays → from(ISO)
    const from = new Date();
    from.setDate(from.getDate() - fromDays);
    const fromISO = from.toISOString();

    const url = new URL('https://newsapi.org/v2/everything');
    url.searchParams.set('q', q);
    url.searchParams.set('searchIn', 'title,description');
    url.searchParams.set('sortBy', 'publishedAt');
    url.searchParams.set('pageSize', pageSize);
    url.searchParams.set('from', fromISO);
    if (searchIn) url.searchParams.set("searchIn", searchIn); 
    if (lang) url.searchParams.set('language', lang);

    const r = await fetch(url.toString(), {
      headers: { 'X-Api-Key': NEWS_KEY }
    });
    const data = await r.json();

    // 성공 시 캐시 저장
    if (r.ok && data?.status === 'ok') {
      cache.set(key, { t: Date.now(), data });
    }

    res.status(r.ok ? 200 : 500).json(data);
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`proxy on :${PORT}`);
});

app.get("/", (_req, res) => {
  res.type("text/plain").send(
    "Souvenir news proxy is running.\n" +
    "Try: /api/health  or  /api/news?q=interior&lang=ko&fromDays=30"
  );
});