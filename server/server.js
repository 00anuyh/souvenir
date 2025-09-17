// server/server.js
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import dotenv from 'dotenv';
import cors from 'cors';                       // ⬅️ 누락되어 있던 부분 (필수)
import { fileURLToPath } from 'url';
import path from 'path';

// ✅ .env를 server 폴더에서 확실히 로드
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const NEWS_KEY = process.env.NEWS_KEY;

// ---------- 기본/보안 ----------
app.set('trust proxy', 1); // Render 등 프록시 뒤에서 secure 쿠키 사용 시
app.use(helmet({
  // 필요한 경우 API 응답만이면 기본값으로 충분.
  // 정적 파일을 같이 서빙한다면 crossOriginResourcePolicy 조정 필요.
}));
app.use(cookieParser());
app.use(express.json()); // ✅ 한 번만 등록

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

// 프리플라이트(OPTIONS) 처리
app.options('*', cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (allowList.length === 0 || allowList.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ---------- Health ----------
app.get('/health', (_req, res) => res.status(200).send('OK'));
app.get('/api/health', (_req, res) => res.json({ ok: true }));

/* =============================================================================
   관리자 인증 (JWT + httpOnly 쿠키)
============================================================================= */
const TOKEN_COOKIE = 'admin_token';

// 시작 로그(모드/이메일 확인용)
console.log('[ADMIN AUTH] mode:', process.env.ADMIN_PASS_HASH ? 'HASH' : (process.env.ADMIN_PASS ? 'PLAIN' : 'UNSET'));
console.log('[ADMIN AUTH] email:', String(process.env.ADMIN_EMAIL || '').trim().toLowerCase());
console.log('[ENV] NODE_ENV=', process.env.NODE_ENV);
console.log('[ENV] CORS allowList=', allowList);

// 디버그 라우트(민감값 노출 없음)
app.get('/api/admin/_debug', (_req, res) => {
  res.json({
    ok: true,
    adminEmail: String(process.env.ADMIN_EMAIL || '').trim().toLowerCase(),
    mode: process.env.ADMIN_PASS_HASH ? 'HASH' : (process.env.ADMIN_PASS ? 'PLAIN' : 'UNSET'),
  });
});

// 로그인 시도 제한
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

function signAdminJwt(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET missing');
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

function requireAdmin(req, res, next) {
  const token = req.cookies?.[TOKEN_COOKIE];
  if (!token) return res.status(401).json({ ok: false, error: 'NO_TOKEN' });
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = data;
    next();
  } catch {
    return res.status(401).json({ ok: false, error: 'BAD_TOKEN' });
  }
}

// 쿠키 옵션(크로스사이트 배포 고려)
function cookieOpts() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,                  // https 필요
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

// 로그인
app.post('/api/admin/login', loginLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'MISSING_FIELDS' });
    }

    const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    if (!adminEmail || email !== adminEmail) {
      return res.status(401).json({ ok: false, error: 'INVALID_CREDENTIALS' });
    }

    let passOK = false;
    if (process.env.ADMIN_PASS_HASH) {
      passOK = await bcrypt.compare(password, process.env.ADMIN_PASS_HASH);
    } else if (process.env.ADMIN_PASS) {
      passOK = password === process.env.ADMIN_PASS;
    }

    if (!passOK) {
      return res.status(401).json({ ok: false, error: 'INVALID_CREDENTIALS' });
    }

    const token = signAdminJwt({ email, role: 'admin' });
    res.cookie(TOKEN_COOKIE, token, cookieOpts());
    return res.json({ ok: true, admin: { email, role: 'admin' } });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

// 세션 확인
app.get('/api/admin/me', requireAdmin, (req, res) => {
  return res.json({ ok: true, admin: req.admin });
});

// 로그아웃 (쿠키 완전 삭제)
app.post('/api/admin/logout', (_req, res) => {
  const opts = cookieOpts();
  res.clearCookie(TOKEN_COOKIE, { path: opts.path, sameSite: opts.sameSite, secure: opts.secure, httpOnly: opts.httpOnly });
  return res.json({ ok: true });
});

// 보호 라우트 예시
app.get('/api/admin/secret', requireAdmin, (_req, res) => {
  res.json({ ok: true, message: 'You are admin 🎉' });
});

/* =============================================================================
   뉴스 프록시 (/api/news)
============================================================================= */
const CACHE_TTL_MS = 30 * 60 * 1000;
const cache = new Map(); // key -> { t, data }
const cacheKey = (params) => crypto.createHash('md5').update(JSON.stringify(params)).digest('hex');

app.get('/api/news', async (req, res) => {
  try {
    if (!NEWS_KEY) {
      return res.status(500).json({ status: 'error', message: 'NEWS_KEY missing on server' });
    }

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

    // Node 18+ 에서는 fetch 내장. (만약 Node 16 이면 node-fetch 필요)
    const r = await fetch(url.toString(), { headers: { 'X-Api-Key': NEWS_KEY } });
    const data = await r.json();

    if (r.ok && data?.status === 'ok') {
      cache.set(key, { t: Date.now(), data });
      return res.status(200).json(data);
    }
    return res.status(r.status || 500).json(data);
  } catch (e) {
    return res.status(500).json({ status: 'error', message: e.message });
  }
});

// ---------- 루트 ----------
app.get('/', (_req, res) => {
  res
    .type('text/plain')
    .send(
      'Souvenir server is running.\n' +
      'Health: /health\n' +
      'Admin: POST /api/admin/login, GET /api/admin/me, POST /api/admin/logout\n' +
      'News:  /api/news?q=interior&lang=ko&fromDays=30\n' +
      'Debug: /api/admin/_debug\n'
    );
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'NOT_FOUND' });
});

// 공통 에러 핸들러
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err?.message || err);
  res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
});

app.listen(PORT, () => {
  console.log(`server on :${PORT}`);
});
