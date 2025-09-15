// server/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';


import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const NEWS_KEY = process.env.NEWS_KEY;

// ---------- 보안/기본 ----------
app.set('trust proxy', 1); // Render 등 프록시 뒤에서 secure 쿠키 사용시
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

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

/* =============================================================================
   관리자 인증 (JWT + httpOnly 쿠키)
============================================================================= */

const TOKEN_COOKIE = 'admin_token';

// 시작 로그(모드/이메일 확인용)
console.log('[ADMIN AUTH] mode:', process.env.ADMIN_PASS_HASH ? 'HASH' : (process.env.ADMIN_PASS ? 'PLAIN' : 'UNSET'));
console.log('[ADMIN AUTH] email:', String(process.env.ADMIN_EMAIL || '').trim().toLowerCase());

// 디버그 라우트(민감값 노출 없음) — 문제시 제거 가능
app.get('/api/admin/_debug', (_req, res) => {
  res.json({
    ok: true,
    adminEmail: String(process.env.ADMIN_EMAIL || '').trim().toLowerCase(),
    mode: process.env.ADMIN_PASS_HASH ? 'HASH' : (process.env.ADMIN_PASS ? 'PLAIN' : 'UNSET'),
  });
});

// 로그인 시도 제한(브루트포스 방지)
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
  // 프론트와 백엔드 도메인이 다르면 SameSite=None; Secure 필요
  return {
    httpOnly: true,
    secure: isProd,   // Render는 https → true 권장
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

    // 비번 검증 (해시 우선, 없으면 평문 비교)
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

// 로그아웃
app.post('/api/admin/logout', (_req, res) => {
  res.clearCookie(TOKEN_COOKIE, { path: '/' });
  return res.json({ ok: true });
});

// 보호 라우트 예시
app.get('/api/admin/secret', requireAdmin, (_req, res) => {
  res.json({ ok: true, message: 'You are admin 🎉' });
});

/* =============================================================================
   뉴스 프록시 (/api/news)
============================================================================= */

const CACHE_TTL_MS = 30 * 60 * 1000; // 30분
const cache = new Map(); // key -> { t, data }
const cacheKey = (params) =>
  crypto.createHash('md5').update(JSON.stringify(params)).digest('hex');

/* // 뉴스 요청 제한(과도한 호출 방지)
const newsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 30,             // 분당 30회
  standardHeaders: true,
  legacyHeaders: false,
}); */

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