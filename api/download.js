// /download/<platform> → 302 to that platform's installer in the latest public release.
// Installers are 1-2 GB, so they are never proxied: the edge caches only the redirect.
const REPO = 'nullmastermind/vibervn-bot-releases'
const ASSETS = {
  windows: /-win-x64\.msix$/,
  'windows-cert': /^ViberVN-signing\.cer$/,
  'mac-arm64': /-mac-arm64\.dmg$/,
  'mac-x64': /-mac-x64\.dmg$/,
  'linux-x64': /-linux-x86_64\.AppImage$/,
  'linux-arm64': /-linux-arm64\.AppImage$/
}

module.exports = async (req, res) => {
  const pattern = ASSETS[req.query.platform]
  if (!pattern) {
    res.status(404).send(`unknown platform; one of: ${Object.keys(ASSETS).join(', ')}`)
    return
  }
  const response = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { accept: 'application/vnd.github+json', 'user-agent': 'bot.viber.vn' }
  })
  const asset = response.ok ? (await response.json()).assets.find(a => pattern.test(a.name)) : undefined
  if (!asset) {
    res.setHeader('cache-control', 'no-store')
    res.redirect(302, `https://github.com/${REPO}/releases`)
    return
  }
  res.setHeader('cache-control', 'public, s-maxage=300, stale-while-revalidate=3600')
  res.redirect(302, asset.browser_download_url)
}
