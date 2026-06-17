import { chromium } from '@playwright/test'

const BASE_URL = 'https://sougei-wine.vercel.app'

const pages = [
  { name: 'ダッシュボード', path: '/' },
  { name: '送り配車', path: '/dispatch' },
  { name: 'ドライバー管理', path: '/masters/drivers' },
  { name: '女の子管理', path: '/masters/girls' },
]

async function takeScreenshots() {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    ignoreHTTPSErrors: true,
  })

  for (const page of pages) {
    const p = await context.newPage()
    await p.goto(BASE_URL + page.path, { waitUntil: 'networkidle' })
    await p.waitForTimeout(1000)
    const filename = `screenshots/${page.name}.png`
    await p.screenshot({ path: filename, fullPage: false })
    console.log(`✓ ${page.name} → ${filename}`)
    await p.close()
  }

  await browser.close()
  console.log('\n完了！')
}

takeScreenshots()
