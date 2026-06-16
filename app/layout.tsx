import type { Metadata } from 'next'
import { Montserrat, Exo_2 } from 'next/font/google'
import './globals.css'

const montserrat = Montserrat({ subsets: ['latin', 'cyrillic'], variable: '--font-montserrat' })
const exo2 = Exo_2({ subsets: ['latin', 'cyrillic'], variable: '--font-exo' })

export const metadata: Metadata = {
  title: 'GameShop — Библиотека поддержки',
  description: 'База знаний по ошибкам и проблемам PlayStation',
  icons: {
    icon: '/gameshopwiki/LogotypeGM.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css" />
      </head>
      <body className={`${montserrat.variable} ${exo2.variable}`}>
        {children}
        <footer>
          <div className="footer-left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
              <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
            </svg>
            <span>Техническая поддержка</span>
            <span className="footer-sep">•</span>
            <span>Мы работаем для вас 24/7</span>
          </div>
          <div className="footer-right">
            <span>Последнее обновление: сегодня, {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="status-dot"></span>
            <span className="status-ok">Все системы работают</span>
          </div>
        </footer>
      </body>
    </html>
  )
}