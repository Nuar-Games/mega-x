import fs from 'node:fs'

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
if (pkg.version !== '1.1.0') {
  console.error(`RELEASE_METADATA_REGRESSION_FAIL expected 1.1.0, got ${pkg.version}`)
  process.exit(1)
}
console.log('RELEASE_METADATA_REGRESSION_PASS')
