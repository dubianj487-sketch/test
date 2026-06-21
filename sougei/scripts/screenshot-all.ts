import { chromium } from 'playwright'
import path from 'path'
import fs from 'fs'

const BASE = 'http://localhost:3000'
const OUT = path.join(process.cwd(), 'scripts/screenshots')
const VIEWPORT = { width: 390, height: 844 }

async function shot(page: any, name: string) {
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: false })
  console.log('✓', name)
}

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()

  /* ── LOGIN ── */
  {
    const page = await browser.newPage()
    await page.setViewportSize(VIEWPORT)
    await page.goto(BASE)
    await shot(page, '00_login')
    await page.close()
  }

  /* ── BOY ── */
  {
    const page = await browser.newPage()
    await page.setViewportSize(VIEWPORT)
    await page.goto(BASE)
    await page.evaluate(() => localStorage.setItem('lm_role', 'boy'))
    await page.goto(BASE + '/boy')
    await shot(page, '01_boy_home')

    // 配車依頼 → NEW
    await page.click('button:has-text("配車を依頼する")')
    await page.waitForTimeout(300)
    await shot(page, '02_boy_new')

    // ドライバー選択
    await page.click('button:has-text("ドライバーを選ぶ")')
    await page.waitForTimeout(300)
    await shot(page, '03_boy_driver_select')

    // HOME に戻る
    await page.goto(BASE + '/boy')
    await page.waitForTimeout(400)
    // 管理タブ
    const adminBtn = page.locator('div[role="button"]:has-text("管理")')
    await adminBtn.click()
    await page.waitForTimeout(300)
    await shot(page, '07_boy_admin')

    await page.close()
  }

  /* ── CAST ── */
  {
    const page = await browser.newPage()
    await page.setViewportSize(VIEWPORT)
    await page.goto(BASE)
    await page.evaluate(() => {
      localStorage.setItem('lm_role', 'cast')
      localStorage.setItem('lm_castId', 'miki')
    })
    await page.goto(BASE + '/cast')
    await shot(page, '08_cast_home')

    // 降車場所タブ
    await page.locator('div[role="button"]:has-text("降車場所")').click()
    await page.waitForTimeout(300)
    await shot(page, '09_cast_place')

    // 申請タブ
    await page.locator('div[role="button"]:has-text("申請")').click()
    await page.waitForTimeout(300)
    await shot(page, '10_cast_request')

    await page.close()
  }

  /* ── DRIVER ── */
  {
    const page = await browser.newPage()
    await page.setViewportSize(VIEWPORT)
    await page.goto(BASE)
    await page.evaluate(() => {
      localStorage.setItem('lm_role', 'driver')
      localStorage.setItem('lm_driverKey', 'sato')
    })
    await page.goto(BASE + '/driver')
    await shot(page, '11_driver_offer')

    // 運行タブ
    await page.locator('div[role="button"]:has-text("運行")').click()
    await page.waitForTimeout(300)
    await shot(page, '12_driver_trip')

    await page.close()
  }

  await browser.close()
  console.log('\nAll screenshots saved to', OUT)
})()
