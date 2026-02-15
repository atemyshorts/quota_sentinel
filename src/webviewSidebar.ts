import * as vscode from 'vscode';
import { SecurityModule } from './securityModule';

export class WebviewSidebar implements vscode.WebviewViewProvider {
    public static readonly viewType = 'quota-sentinel-sidebar';
    public static readonly managerViewType = 'quota-sentinel-sidebar-manager';

    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _stateEmitter: vscode.EventEmitter<any>
    ) {
        // Listen for state changes from other views or the extension
        this._stateEmitter.event(data => {
            this._updateView(data);
        });
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'onInfo': {
                    vscode.window.showInformationMessage(data.value);
                    break;
                }
                case 'onError': {
                    vscode.window.showErrorMessage(data.value);
                    break;
                }
                case 'ready': {
                    // Trigger a refresh request
                    this._stateEmitter.fire({ type: 'refresh-request' });
                    break;
                }
            }
        });
    }

    private _updateView(data: any) {
        if (this._view) {
            this._view.webview.postMessage(data);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'gaugeStyles.css'));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'gaugeLogic.js'));

        const nonce = getNonce();

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="${SecurityModule.getStrictCSP(this._extensionUri, nonce)}">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${styleUri}" rel="stylesheet">
            <title>Quota Sentinel</title>
        </head>
        <body>
            <h2>Quota Sentinel</h2>
            <div id="gauges-root">
                <!-- Gauges will be injected here -->
                <div style="text-align: center; color: #666;">Waiting for data...</div>
            </div>
            
            <div class="parallel-load">
                <div style="display: flex; justify-content: space-between; font-size: 10px; color: #aaa;">
                    <span>PARALLEL LOAD</span>
                    <span id="load-count">0 AGENTS</span>
                </div>
                <div class="load-bar-container">
                    <div class="load-bar-fill" id="load-bar" style="width: 0%"></div>
                </div>
            </div>

            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
