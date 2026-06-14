import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Простой in-memory rate limiter
const rateLimit = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_MAX = 30;      // макс запросов
const RATE_LIMIT_WINDOW = 10_000; // окно в миллисекундах (10 секунд)

export function middleware(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  const now = Date.now();

  // Очистка устаревших записей (когда накопилось много)
  if (rateLimit.size > 1000) {
    const threshold = now - RATE_LIMIT_WINDOW;
    rateLimit.forEach((val, key) => {
      if (val.resetTime < threshold) rateLimit.delete(key);
    });
  }

  const record = rateLimit.get(ip);

  if (!record || record.resetTime < now) {
    // Новое окно для этого IP
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return NextResponse.next();
  }

  if (record.count >= RATE_LIMIT_MAX) {
    // Превышен лимит — возвращаем 429 Too Many Requests
    return new NextResponse(
      JSON.stringify({ error: 'Too Many Requests' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(RATE_LIMIT_WINDOW / 1000),
        },
      }
    );
  }

  record.count += 1;
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Применяем ко всем API-маршрутам
    '/api/:path*',
  ],
};