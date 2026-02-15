import * as vscode from 'vscode';

/**
 * The Fortress Security Module.
 * 
 * DESIGN PRINCIPLE: ZERO-EXFILTRATION.
 * This module enforces local-only data handling and strictly limits what the extension can do.
 */
export class SecurityModule {

    constructor(private readonly _context: vscode.ExtensionContext) {
        this._registerAuditCommand();
    }

    /**
     * Registers a command that allows the user to inspect this very file.
     * Transparency is the best security.
     */
    private _registerAuditCommand() {
        this._context.subscriptions.push(
            vscode.commands.registerCommand('antigravity.quotaSentinel.audit', async () => {
                const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(__filename));
                await vscode.window.showTextDocument(doc);
                vscode.window.showInformationMessage('Security Audit: This is the source code running on your machine.');
            })
        );
    }

    /**
     * Generates a strict Content-Security-Policy string for Webviews.
     * Blocks all external connections (connect-src 'none').
     */
    public getStrictCSP(nonce: string): string {
        return `default-src 'none'; style-src ${this._context.extensionUri} 'unsafe-inline'; script-src 'nonce-${nonce}'; connect-src 'none'; img-src ${this._context.extensionUri} data:;`;
    }

    /**
     * Securely stores an API key (if we were using one, which we aren't by default).
     * Uses the OS Keychain via vscode.secrets.
     */
    public async storeSecret(key: string, value: string): Promise<void> {
        await this._context.secrets.store(key, value);
    }

    public async getSecret(key: string): Promise<string | undefined> {
        return await this._context.secrets.get(key);
    }
}
