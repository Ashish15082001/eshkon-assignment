// Merges per-page axe-*.json files written during Playwright tests into a single a11y-report.json.
// Exits with code 1 if any critical violations are found, so CI fails independently of test assertions.
const fs = require('fs')
const path = require('path')

const dir = path.join(process.cwd(), 'tests/e2e/results')
fs.mkdirSync(dir, { recursive: true })

const axeFiles = fs.readdirSync(dir).filter((f) => f.startsWith('axe-') && f.endsWith('.json'))
const pages = axeFiles.map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))
const allViolations = pages.flatMap((p) => p.violations ?? [])

const report = {
  generated: new Date().toISOString(),
  pages,
  summary: {
    critical: allViolations.filter((v) => v.impact === 'critical').length,
    serious: allViolations.filter((v) => v.impact === 'serious').length,
    moderate: allViolations.filter((v) => v.impact === 'moderate').length,
    minor: allViolations.filter((v) => v.impact === 'minor').length,
  },
}

fs.writeFileSync(path.join(dir, 'a11y-report.json'), JSON.stringify(report, null, 2))
console.log(`a11y-report.json: ${pages.length} page(s) scanned`)
console.log(`Summary: ${JSON.stringify(report.summary)}`)

const blocking = report.summary.critical + report.summary.serious
if (blocking > 0) {
  console.error(
    `FAIL: ${report.summary.critical} critical + ${report.summary.serious} serious accessibility violation(s) found`
  )
  process.exit(1)
}
