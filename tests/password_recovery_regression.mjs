import fs from 'node:fs'

const authSource = fs.readFileSync('src/onlineAuth.ts', 'utf8')
const appSource = fs.readFileSync('src/App.tsx', 'utf8')
const resetPage = fs.readFileSync('public/reset-password.html', 'utf8')
const failures = []
const check = (ok, message) => { if (!ok) failures.push(message) }

check(/requestPasswordReset/.test(authSource), 'requestPasswordReset helper missing from real source')
check(/\/auth\/v1\/recover\?redirect_to=/.test(authSource), 'Supabase recover endpoint missing')
check(/reset-password\.html/.test(authSource), 'password reset redirect target missing')
check(/consumeRecoverySessionFromHash/.test(authSource), 'recovery-session consumer missing')
check(/params\.get\('type'\) !== 'recovery'/.test(authSource), 'recovery token type guard missing')
check(/updatePassword/.test(authSource), 'updatePassword helper missing')
check(/\/auth\/v1\/user/.test(authSource), 'Supabase password update endpoint missing')
check(/PASSWORD_TOO_SHORT/.test(authSource), 'minimum password guard missing')
check(/type=recovery/.test(authSource), 'Google hash consumer does not exclude recovery sessions')

check(/FORGOT PASSWORD\?/.test(appSource), 'Forgot Password UI action missing')
check(/PASSWORD RESET EMAIL SENT/.test(appSource), 'reset request success feedback missing')
check(/requestPasswordReset\(authEmail\.trim\(\)\)/.test(appSource), 'Forgot Password UI is not wired to the real reset helper')

check(/id="reset-form"/.test(resetPage), 'reset password form missing')
check(/minlength="8"/.test(resetPage), 'reset page minimum password length missing')
check(/params\.get\('type'\)/.test(resetPage), 'reset page recovery type parsing missing')
check(/recoveryType !== 'recovery'/.test(resetPage), 'reset page recovery type validation missing')
check(/Authorization: `Bearer \$\{accessToken\}`/.test(resetPage), 'reset page bearer authorization missing')
check(/method: 'PUT'/.test(resetPage) && /\/auth\/v1\/user/.test(resetPage), 'reset page password update request missing')
check(/PASSWORDS DO NOT MATCH/.test(resetPage), 'password confirmation mismatch guard missing')
check(/PASSWORD UPDATED\./.test(resetPage), 'password reset completion feedback missing')

if (failures.length) {
  console.error('PASSWORD_RECOVERY_REGRESSION_FAIL')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('PASSWORD_RECOVERY_REGRESSION_PASS')
