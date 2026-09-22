import fs from 'node:fs'

const authPatch = fs.readFileSync('scripts/patch-auth-runtime.mjs', 'utf8')
const resetPage = fs.readFileSync('public/reset-password.html', 'utf8')
const appSource = fs.readFileSync('src/App.tsx', 'utf8')
const failures = []
const check = (ok, message) => { if (!ok) failures.push(message) }

check(/requestPasswordReset/.test(authPatch), 'requestPasswordReset helper patch missing')
check(/\/auth\/v1\/recover\?redirect_to=/.test(authPatch), 'Supabase recover endpoint missing')
check(/reset-password\.html/.test(authPatch), 'password reset redirect target missing')
check(/consumeRecoverySessionFromHash/.test(authPatch), 'recovery-session consumer missing')
check(/params\.get\('type'\) !== 'recovery'/.test(authPatch), 'recovery token type guard missing')
check(/updatePassword/.test(authPatch), 'updatePassword helper missing')
check(/\/auth\/v1\/user/.test(authPatch), 'Supabase password update endpoint missing')
check(/PASSWORD_TOO_SHORT/.test(authPatch), 'minimum password guard missing')
check(/FORGOT PASSWORD\?/.test(authPatch), 'Forgot Password UI action missing')
check(/PASSWORD RESET EMAIL SENT/.test(authPatch), 'reset request success feedback missing')
check(/type=recovery/.test(authPatch), 'Google hash consumer does not exclude recovery sessions')

check(/id="reset-form"/.test(resetPage), 'reset password form missing')
check(/minlength="8"/.test(resetPage), 'reset page minimum password length missing')
check(/params\.get\('type'\)/.test(resetPage), 'reset page recovery type parsing missing')
check(/recoveryType !== 'recovery'/.test(resetPage), 'reset page recovery type validation missing')
check(/Authorization: `Bearer \$\{accessToken\}`/.test(resetPage), 'reset page bearer authorization missing')
check(/method: 'PUT'/.test(resetPage) && /\/auth\/v1\/user/.test(resetPage), 'reset page password update request missing')
check(/PASSWORDS DO NOT MATCH/.test(resetPage), 'password confirmation mismatch guard missing')
check(/PASSWORD UPDATED\./.test(resetPage), 'password reset completion feedback missing')

check(/if \(authMode === 'SIGN_UP'\) \{\s*window\.location\.reload\(\)\s*return\s*\}/.test(appSource), 'successful signup does not auto-refresh into saved-session startup flow')

if (failures.length) {
  console.error('PASSWORD_RECOVERY_REGRESSION_FAIL')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('PASSWORD_RECOVERY_REGRESSION_PASS')
