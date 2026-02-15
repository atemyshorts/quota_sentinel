# Antigravity Quota Sentinel

> **A Free and Open Source extension brought to you by [Appranch Studio](https://www.appranchstudio.com).**

![License](https://img.shields.io/badge/License-GPL%20v3-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue)

**Quota Sentinel** is an ultra-secure, local-first extension designed to monitor your LLM token usage and parallel agent load in real-time. It provides a sleek, "Fortress Mode" sidebar that ensures your data never leaves your machine.

## 🛡️ Key Features

*   **Zero-Exfiltration Promise**: No external backend. No tracking. All logs are parsed locally from `.gemini/logs`.
*   **Dual-Surface HUD**: Automatically appears in both your Editor Sidebar and Agent Manager view.
*   **Shared Bucket Visualization**: Concentric radial gauges visually represent shared quotas between models (e.g., Claude 3.5 Sonnet & Haiku).
*   **Live Pulse Alerts**: The UI "pulses" when your quota drops below 15% (Warning) or 5% (Critical).
*   **Parallel Load Meter**: Track how many Antigravity agents are running in parallel.
*   **Guanajuato Timezone Sync**: Automatic reset tracking aligned with standard CST resets.

## 🚀 Getting Started

1.  **Install**: Search for "Quota Sentinel" in the extensions view.
2.  **Onboard**: Complete the "Fortress" security check on first launch.
3.  **Monitor**: Keep the sidebar open to watch your token burn in real-time.

## 🔒 Security

We believe in transparency. You can audit the source code of the running extension at any time by running the command:
`> Antigravity Quota Sentinel: Audit Source Code`

## 📦 Installation & Testing

### Option 1: Quick Test (Debug Mode)
1.  Open this folder in VS Code / Antigravity.
2.  Press **F5** to launch a new "Extension Development Host" window.
3.  The extension will be active in that new window.

### Option 2: Sideloading (Production Mode)
1.  Install `vsce` if you haven't: `npm install -g @vscode/vsce`
2.  Package the extension: `vsce package`
3.  This will create a `.vsix` file (e.g., `antigravity-quota-sentinel-1.0.0.vsix`).
4.  Install it in your editor:
    *   **Command Palette**: `Extensions: Install from VSIX...`
    *   Select the generated `.vsix` file.

## 🛡️ Security Log

Transparancy is key to trust. Below is a log of security audits and applied fixes.

### Audit: 2026-02-15 (v1.0.1)
**Auditor**: Antigravity Security Auditor
**Status**: All Findings Resolved.

*   **[FIXED] Potential DoS in Log Reader**: Capped log read buffer to 1MB per loop to prevent Out-Of-Memory crashes if the log file grows unexpectedly large.
*   **[FIXED] CSP Divergence**: Refactored `webviewSidebar.ts` to use the centralized, strict Content-Security-Policy definition from `SecurityModule`.
*   **[FIXED] Potential XSS in Visualization**: Updated `gaugeLogic.js` to safely set text content via DOM methods instead of `innerHTML`, preventing potential script injection from malicious model names.

---

## 🔗 Links via Appranch Studio

*   **Website**: [www.appranchstudio.com](https://www.appranchstudio.com)
*   **GitHub Repository**: [github.com/atemyshorts/quota_sentinel](https://github.com/atemyshorts/quota_sentinel)
*   **Contact**: contact@appranchstudio.com

---

**Antigravity Quota Sentinel** is a project by [Appranch Studio](https://www.appranchstudio.com).
*Empowering developers with secure, high-performance tools.*
