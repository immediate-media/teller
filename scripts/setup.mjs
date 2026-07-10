#!/usr/bin/env node
// setup.mjs — Project Teller local environment setup
// Cross-platform (macOS + Windows). Requires Node.js >= 18.

import { createInterface } from 'readline'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const ENV_FILE = join(ROOT, '.env.local')
const ENV_EXAMPLE = join(ROOT, '.env.local.example')

// ─── Colours (gracefully degraded on Windows without ANSI support) ───────────
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
}
const fmt = (colour, text) => `${colour}${text}${c.reset}`
const ok = (msg) => console.log(fmt(c.green, `  ✓ ${msg}`))
const warn = (msg) => console.log(fmt(c.yellow, `  ⚠ ${msg}`))
const err = (msg) => console.log(fmt(c.red, `  ✗ ${msg}`))
const info = (msg) => console.log(fmt(c.dim, `    ${msg}`))
const header = (msg) => console.log(`\n${fmt(c.bold + c.cyan, msg)}`)
const divider = () => console.log(fmt(c.dim, '  ' + '─'.repeat(56)))

// ─── Input helper ─────────────────────────────────────────────────────────────
function prompt(rl, question, { secret = false, defaultVal = '' } = {}) {
  return new Promise((resolve) => {
    const suffix = defaultVal ? fmt(c.dim, ` [${defaultVal}]`) : ''
    if (secret && process.stdin.isTTY) {
      process.stdout.write(`  ${question}${suffix}: `)
      process.stdin.setRawMode(true)
      process.stdin.resume()
      let input = ''
      process.stdin.on('data', function handler(ch) {
        ch = ch.toString()
        if (ch === '\r' || ch === '\n') {
          process.stdin.setRawMode(false)
          process.stdin.pause()
          process.stdin.removeListener('data', handler)
          process.stdout.write('\n')
          resolve(input || defaultVal)
        } else if (ch === '\u0003') {
          process.exit()
        } else if (ch === '\u007f') {
          if (input.length > 0) {
            input = input.slice(0, -1)
            process.stdout.clearLine(0)
            process.stdout.cursorTo(0)
            process.stdout.write(`  ${question}${suffix}: ${'*'.repeat(input.length)}`)
          }
        } else {
          input += ch
          process.stdout.write('*')
        }
      })
    } else {
      rl.question(`  ${question}${suffix}: `, (answer) => {
        resolve(answer.trim() || defaultVal)
      })
    }
  })
}

async function confirm(rl, question, defaultYes = true) {
  const hint = defaultYes ? '[Y/n]' : '[y/N]'
  const answer = await prompt(rl, `${question} ${fmt(c.dim, hint)}`)
  if (!answer) return defaultYes
  return answer.toLowerCase().startsWith('y')
}

// ─── Prerequisite checks ──────────────────────────────────────────────────────
function checkPrerequisites() {
  header('Checking prerequisites')
  divider()

  // Node version
  const nodeVersion = process.versions.node
  const [major] = nodeVersion.split('.').map(Number)
  if (major < 18) {
    err(`Node.js ${nodeVersion} is too old. Please install Node.js 18 or later.`)
    info('Download from: https://nodejs.org/')
    process.exit(1)
  }
  ok(`Node.js ${nodeVersion}`)

  // Package manager
  let packageManager = 'npm'
  try {
    execSync('yarn --version', { stdio: 'ignore' })
    packageManager = 'yarn'
    ok('yarn')
  } catch {
    try {
      execSync('npm --version', { stdio: 'ignore' })
      ok('npm (yarn not found, will use npm)')
    } catch {
      err('Neither yarn nor npm found. Please install Node.js from https://nodejs.org/')
      process.exit(1)
    }
  }

  // Git
  try {
    execSync('git --version', { stdio: 'ignore' })
    ok('git')
  } catch {
    warn('git not found — git evidence gathering will not work.')
    info('Download from: https://git-scm.com/')
  }

  return packageManager
}

// ─── Credential validation ────────────────────────────────────────────────────
async function validateAnthropicKey(apiKey) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'hi' }],
      }),
    })
    return res.status !== 401
  } catch {
    return false
  }
}

async function validateAtlassian(url, email, token) {
  try {
    const base = url.replace(/\/$/, '')
    const auth = `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`
    const res = await fetch(`${base}/rest/api/3/myself`, {
      headers: { Authorization: auth, Accept: 'application/json' },
    })
    return res.ok
  } catch {
    return false
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log()
  console.log(fmt(c.bold + c.blue, '  ╔══════════════════════════════════╗'))
  console.log(fmt(c.bold + c.blue, '  ║     Project Teller — Setup       ║'))
  console.log(fmt(c.bold + c.blue, '  ╚══════════════════════════════════╝'))
  console.log()
  console.log(fmt(c.dim, '  This script will create your .env.local and install dependencies.'))

  const rl = createInterface({ input: process.stdin, output: process.stdout })

  // Check if .env.local already exists
  if (existsSync(ENV_FILE)) {
    header('Existing configuration found')
    divider()
    warn('.env.local already exists.')
    const overwrite = await confirm(rl, 'Do you want to reconfigure it?', false)
    if (!overwrite) {
      ok('Keeping existing .env.local')
      rl.close()
      await installAndStart(rl)
      return
    }
  }

  const packageManager = checkPrerequisites()

  // ── Anthropic API Key ──────────────────────────────────────────────────────
  header('Anthropic API Key')
  divider()
  console.log(fmt(c.dim, '  Required for all AI analysis. Ask your lead or a senior engineer.'))
  console.log(fmt(c.dim, '  Or create one at: https://console.anthropic.com/settings/keys'))
  console.log()

  let anthropicKey = ''
  let anthropicValid = false
  while (!anthropicValid) {
    anthropicKey = await prompt(rl, 'Paste your Anthropic API key', { secret: true })
    if (!anthropicKey.startsWith('sk-ant-')) {
      err("That doesn't look like an Anthropic key (should start with sk-ant-).")
      const retry = await confirm(rl, 'Try again?')
      if (!retry) { warn('Skipping key validation — you can edit .env.local manually later.'); break }
      continue
    }
    process.stdout.write(fmt(c.dim, '  Validating key…'))
    anthropicValid = await validateAnthropicKey(anthropicKey)
    process.stdout.write('\r' + ' '.repeat(40) + '\r')
    if (anthropicValid) {
      ok('API key is valid')
    } else {
      err('API key was rejected by Anthropic.')
      info('The key may be revoked or invalid. Get a new one from your lead or')
      info('create one at: https://console.anthropic.com/settings/keys')
      const retry = await confirm(rl, 'Try a different key?')
      if (!retry) { warn('Continuing with unvalidated key — app will fail until fixed.'); break }
    }
  }

  // ── Atlassian ──────────────────────────────────────────────────────────────
  header('Atlassian Credentials (Jira + Confluence)')
  divider()
  console.log(fmt(c.dim, '  Used to search Jira issues and Confluence pages for context.'))
  console.log(fmt(c.dim, '  Uses your standard Immediate Media Atlassian account.'))
  console.log()
  console.log(fmt(c.dim, '  To create an API token:'))
  console.log(fmt(c.dim, '  → https://id.atlassian.com/manage-profile/security/api-tokens'))
  console.log()

  const atlassianUrl = await prompt(rl, 'Atlassian URL', { defaultVal: 'https://immediateco.atlassian.net' })
  const atlassianEmail = await prompt(rl, 'Your Atlassian email (e.g. sam.pepper@immediate.co.uk)')
  let atlassianToken = ''
  let atlassianValid = false

  while (!atlassianValid) {
    atlassianToken = await prompt(rl, 'Your Atlassian API token', { secret: true })
    if (!atlassianToken) {
      warn('No token entered — Jira and Confluence search will be skipped.')
      break
    }
    process.stdout.write(fmt(c.dim, '  Validating Atlassian credentials…'))
    atlassianValid = await validateAtlassian(atlassianUrl, atlassianEmail, atlassianToken)
    process.stdout.write('\r' + ' '.repeat(50) + '\r')
    if (atlassianValid) {
      ok('Atlassian credentials are valid')
    } else {
      err('Could not authenticate with Atlassian.')
      info('Check your email address is correct and the token has not expired.')
      info('Create a new token at: https://id.atlassian.com/manage-profile/security/api-tokens')
      const retry = await confirm(rl, 'Try again?')
      if (!retry) { warn('Continuing with unvalidated credentials — Atlassian search will fail.'); break }
    }
  }

  // ── Write .env.local ───────────────────────────────────────────────────────
  header('Writing .env.local')
  divider()

  const envContent = [
    `# Generated by setup.mjs on ${new Date().toISOString()}`,
    `# Do not commit this file — it contains secrets.`,
    ``,
    `ANTHROPIC_API_KEY=${anthropicKey}`,
    ``,
    `ATLASSIAN_URL=${atlassianUrl}`,
    `ATLASSIAN_EMAIL=${atlassianEmail}`,
    `ATLASSIAN_API_TOKEN=${atlassianToken}`,
  ].join('\n') + '\n'

  writeFileSync(ENV_FILE, envContent, 'utf8')
  ok('.env.local written')

  rl.close()
  await installAndStart(packageManager)
}

async function installAndStart(packageManager) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })

  // ── Install dependencies ───────────────────────────────────────────────────
  header('Installing dependencies')
  divider()

  try {
    const cmd = packageManager === 'yarn' ? 'yarn install' : 'npm install'
    console.log(fmt(c.dim, `  Running ${cmd}…`))
    execSync(cmd, { cwd: ROOT, stdio: 'inherit' })
    ok('Dependencies installed')
  } catch {
    err('Dependency installation failed. Try running yarn install manually.')
    rl.close()
    process.exit(1)
  }

  // ── Offer to start dev server ──────────────────────────────────────────────
  header('You\'re ready!')
  divider()
  console.log()
  console.log(fmt(c.green + c.bold, '  Project Teller is set up and ready to run.'))
  console.log()
  console.log(fmt(c.dim, '  Once running, open: http://localhost:3000'))
  console.log()

  const startNow = await confirm(rl, 'Start the dev server now?')
  rl.close()

  if (startNow) {
    console.log()
    console.log(fmt(c.dim, '  Starting dev server… (Ctrl+C to stop)'))
    console.log()
    const cmd = packageManager === 'yarn' ? 'yarn dev' : 'npm run dev'
    execSync(cmd, { cwd: ROOT, stdio: 'inherit' })
  } else {
    console.log()
    info(`When you're ready, run: ${packageManager === 'yarn' ? 'yarn dev' : 'npm run dev'}`)
    console.log()
  }
}

main().catch((e) => {
  console.error(fmt(c.red, `\n  Unexpected error: ${e.message}`))
  process.exit(1)
})
