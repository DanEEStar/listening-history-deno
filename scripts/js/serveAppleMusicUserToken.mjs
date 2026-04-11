// Run with: node serveAppleMusicUserToken.mjs
// Requires: npm install jose
// Env vars: APPLE_TEAM_ID, APPLE_MUSIC_KEY_ID, APPLE_MUSIC_PRIVATE_KEY

import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { execSync } from 'node:child_process'
import { SignJWT, importPKCS8 } from 'jose'

const __dir = dirname(fileURLToPath(import.meta.url))

const teamId = process.env.APPLE_TEAM_ID
const keyId = process.env.APPLE_MUSIC_KEY_ID
let privateKeyPem = process.env.APPLE_MUSIC_PRIVATE_KEY

if (!teamId || !keyId || !privateKeyPem) {
  console.error('❌ Please set APPLE_TEAM_ID, APPLE_MUSIC_KEY_ID, and APPLE_MUSIC_PRIVATE_KEY')
  process.exit(1)
}

privateKeyPem = privateKeyPem.replace(/\\n/g, '\n')

const now = Math.floor(Date.now() / 1000)
const exp = now + 15777000 // ~6 months

const key = await importPKCS8(privateKeyPem, 'ES256')
const devToken = await new SignJWT({ iss: teamId, iat: now, exp })
  .setProtectedHeader({ alg: 'ES256', kid: keyId, typ: 'JWT' })
  .setIssuer(teamId)
  .setIssuedAt(now)
  .setExpirationTime(exp)
  .sign(key)

console.log('✅ Developer token generated')
console.log(`\nexport APPLE_MUSIC_DEV_TOKEN='${devToken}'\n`)

const html = readFileSync(join(__dir, 'appleMusicUserToken.html'), 'utf8')
  .replaceAll('<APPLE_MUSIC_DEV_TOKEN>', devToken)

const PORT = 8765
createServer((_, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end(html)
}).listen(PORT, () => {
  const url = `http://localhost:${PORT}`
  console.log(`Serving at ${url}`)
  execSync(`open ${url}`)
})
