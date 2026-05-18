import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { createClient } from '@/lib/supabase/server'
import './globals.css'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

// Map font names to Google Fonts URL-safe names
const GOOGLE_FONT_MAP: Record<string, string> = {
  'Inter': 'Inter',
  'Poppins': 'Poppins',
  'Montserrat': 'Montserrat',
  'Oswald': 'Oswald',
  'Playfair Display': 'Playfair+Display',
  'Roboto': 'Roboto',
  'Open Sans': 'Open+Sans',
  'Lato': 'Lato',
}

async function getBranding() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('tenant_config_publica')
      .select('favicon_url, fuente_titulos, fuente_cuerpo, nombre_display, color_primario, color_secundario')
      .eq('tenant_id', TENANT_ID)
      .maybeSingle()
    return data
  } catch {
    return null
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getBranding()

  const icons: Metadata['icons'] = {}
  if (branding?.favicon_url) {
    icons.icon = branding.favicon_url
  }

  return {
    title: branding?.nombre_display ?? 'Hindu Club - ClubCore',
    description: 'Plataforma de gestión Hindu Club Fútbol',
    icons,
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const branding = await getBranding()

  const fuenteTitulos = branding?.fuente_titulos ?? 'Inter'
  const fuenteCuerpo = branding?.fuente_cuerpo ?? 'Inter'
  const colorPrimario = branding?.color_primario || null
  const colorSecundario = branding?.color_secundario || null

  // Build Google Fonts import URL
  const fontsToLoad = new Set<string>()
  if (GOOGLE_FONT_MAP[fuenteTitulos]) fontsToLoad.add(GOOGLE_FONT_MAP[fuenteTitulos])
  if (GOOGLE_FONT_MAP[fuenteCuerpo]) fontsToLoad.add(GOOGLE_FONT_MAP[fuenteCuerpo])

  const googleFontsUrl = fontsToLoad.size > 0
    ? `https://fonts.googleapis.com/css2?${Array.from(fontsToLoad).map(f => `family=${f}:wght@400;500;600;700`).join('&')}&display=swap`
    : null

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {googleFontsUrl && (
           
          <link rel="stylesheet" href={googleFontsUrl} />
        )}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --font-heading: '${fuenteTitulos}', var(--font-geist-sans), sans-serif;
                --font-body: '${fuenteCuerpo}', var(--font-geist-sans), sans-serif;
                ${colorPrimario ? `--primary-500: ${colorPrimario};` : ''}
                ${colorSecundario ? `--accent-gold-500: ${colorSecundario};` : ''}
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" style={{ fontFamily: `var(--font-body)` }}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
