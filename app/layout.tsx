import './global.css';
import { ThemeProvider } from './components/layout/ThemeContext';
import { SessionProvider } from './components/layout/SessionProvider';
import { SocketProvider } from '../lib/providers/SocketProvider';

export const metadata = {
  title: 'Momentum - Family Task & Reward System',
  description: 'ADHD-friendly family management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <SocketProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </SocketProvider>
        </SessionProvider>
      </body>
    </html>
  )
}