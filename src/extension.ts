import * as vscode from 'vscode';
import { WebviewSidebar } from './webviewSidebar';
import { QuotaProvider } from './quotaProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Antigravity Quota Sentinel is now active!');

    // Shared event emitter for state synchronization
    const stateEmitter = new vscode.EventEmitter<any>();

    // Initialize Quota Provider (The Passive Engine)
    const quotaProvider = new QuotaProvider(stateEmitter);
    context.subscriptions.push({ dispose: () => quotaProvider.dispose() });

    // distinct providers for each view, but sharing the same state emitter
    const sidebarProvider = new WebviewSidebar(context.extensionUri, stateEmitter);
    const managerProvider = new WebviewSidebar(context.extensionUri, stateEmitter);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'quota-sentinel-sidebar',
            sidebarProvider
        )
    );

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'quota-sentinel-sidebar-manager',
            managerProvider
        )
    );

    // Command to manually trigger an update (for testing)
    context.subscriptions.push(
        vscode.commands.registerCommand('antigravity.quotaSentinel.ping', () => {
            stateEmitter.fire({ type: 'ping', value: 'Hello from Extension Host!' });
        })
    );
}

export function deactivate() { }
