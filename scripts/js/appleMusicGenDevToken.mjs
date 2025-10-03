// Run with: node generate-dev-token.mjs
// Requires: npm install jose

import { SignJWT, importPKCS8 } from 'jose'

const teamId = process.env.APPLE_TEAM_ID
const keyId = process.env.APPLE_MUSIC_KEY_ID
let privateKeyPem = process.env.APPLE_MUSIC_PRIVATE_KEY

if (!teamId || !keyId || !privateKeyPem) {
  console.error('❌ Please set APPLE_TEAM_ID, APPLE_MUSIC_KEY_ID, and APPLE_MUSIC_PRIVATE_KEY')
  process.exit(1)
}

// If you stored the key as one long line with "\n", fix it:
privateKeyPem = privateKeyPem.replace(/\\n/g, '\n')

const now = Math.floor(Date.now() / 1000)

// Apple allows up to ~6 months (15777000 seconds)
// Here: 7 days = 604800 seconds
const exp = now + 15777000

async function main() {
  const key = await importPKCS8(privateKeyPem, 'ES256')

  const jwt = await new SignJWT({
    iss: teamId,
    iat: now,
    exp
  })
    .setProtectedHeader({ alg: 'ES256', kid: keyId, typ: 'JWT' })
    .setIssuer(teamId)
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(key)

  console.log(jwt)
}

main().catch(err => {
  console.error('Error creating token:', err)
  process.exit(1)
})