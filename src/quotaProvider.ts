import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class ModelBucket {
    public currentUsage: number = 0;
    public readonly limit: number;
    public readonly modelNames: string[];

    constructor(limit: number, modelNames: string[]) {
        this.limit = limit;
        this.modelNames = modelNames;
    }

    public addUsage(amount: number) {
        this.currentUsage += amount;
    }

    public reset() {
        this.currentUsage = 0;
    }

    public get percentage(): number {
        return (this.currentUsage / this.limit) * 100;
    }
}

export class QuotaProvider {
    private _buckets: Map<string, ModelBucket> = new Map(); // bucketId -> ModelBucket
    private _logWatcher: fs.FSWatcher | undefined;
    private _logPath: string;
    private _lastSize: number = 0;
    private readonly _timezoneOffset = -6; // Guanajuato (UTC-6)

    constructor(private readonly _stateEmitter: vscode.EventEmitter<any>) {
        // Listen for refresh requests from the UI
        this._stateEmitter.event(event => {
            if (event.type === 'refresh-request') {
                this._broadcastUpdate();
            }
        });
        // Assume .gemini/logs is at the root of the workspace or user home
        // For this extension, let's assume a fixed path relative to user home for now, 
        // or discoverable via workspace.
        const homeDir = process.env.HOME || process.env.USERPROFILE || '';
        this._logPath = path.join(homeDir, '.gemini', 'logs', 'antigravity.log');

        this._initializeBuckets();
        this._startWatching();
        this._checkReset(); // Check if we need to reset usage based on time

        // simple polling for reset check every minute
        setInterval(() => this._checkReset(), 60000);
    }

    private _initializeBuckets() {
        // Example configuration - this could be dynamic later
        this._buckets.set('tier-1', new ModelBucket(1000000, ['claude-3-5-sonnet', 'claude-3-opus']));
        this._buckets.set('tier-2', new ModelBucket(2000000, ['claude-3-haiku', 'gemini-flash']));
    }

    private _startWatching() {
        if (!fs.existsSync(this._logPath)) {
            console.log(`Log file not found at ${this._logPath}, waiting...`);
            // In a real implementation, we'd watch the directory or retry.
            return;
        }

        const stats = fs.statSync(this._logPath);
        this._lastSize = stats.size;

        this._logWatcher = fs.watch(this._logPath, (eventType) => {
            if (eventType === 'change') {
                this._readNewLogs();
            }
        });
    }

    private _readNewLogs() {
        try {
            const stats = fs.statSync(this._logPath);
            const sizeDiff = stats.size - this._lastSize;
            if (sizeDiff <= 0) {
                this._lastSize = stats.size;
                return;
            }

            // Security Fix: Cap read buffer to 1MB to prevent OOM
            const MAX_READ_SIZE = 1024 * 1024; // 1MB
            const readSize = Math.min(sizeDiff, MAX_READ_SIZE);

            const buffer = Buffer.alloc(readSize);
            const fd = fs.openSync(this._logPath, 'r');
            fs.readSync(fd, buffer, 0, readSize, this._lastSize);
            fs.closeSync(fd);
            this._lastSize = stats.size;

            const newLines = buffer.toString().split('\n');
            for (const line of newLines) {
                if (!line.trim()) continue;
                try {
                    const logEntry = JSON.parse(line);
                    this._processLogEntry(logEntry);
                } catch (e) {
                    console.error('Failed to parse log line:', line);
                }
            }

            this._broadcastUpdate();

        } catch (error) {
            console.error('Error reading logs:', error);
        }
    }

    private _processLogEntry(entry: any) {
        // Expected format: { "model": "claude-3-5-sonnet", "token_count": 150, "timestamp": ... }
        if (!entry.model || !entry.token_count) return;

        for (const bucket of this._buckets.values()) {
            if (bucket.modelNames.includes(entry.model)) {
                bucket.addUsage(entry.token_count);
                // We could break here if a model only belongs to one bucket
            }
        }
    }

    private _checkReset() {
        // Guanajuato is UTC-6. Reset at 00:00 local time = 06:00 UTC.
        // Or user might want strict 24h rolling? sticking to daily reset logic as implied.
        const now = new Date();
        const utcHours = now.getUTCHours();

        // Simple logic: if it's 6 AM UTC (midnight CST), reset.
        // To be robust, we should store last reset date. 
        // For this prototype, let's just log it.
        // Implementation: explicitly get current time in target timezone
        const localTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
        if (localTime.getHours() === 0 && localTime.getMinutes() === 0) {
            // Reset all buckets
            for (const bucket of this._buckets.values()) {
                bucket.reset();
            }
            this._broadcastUpdate();
        }
    }

    private _broadcastUpdate() {
        const payload: any = { type: 'quota-update', buckets: {} };
        for (const [id, bucket] of this._buckets) {
            payload.buckets[id] = {
                usage: bucket.currentUsage,
                limit: bucket.limit,
                percentage: bucket.percentage,
                models: bucket.modelNames
            };
        }
        this._stateEmitter.fire(payload);
    }

    public dispose() {
        if (this._logWatcher) {
            this._logWatcher.close();
        }
    }
}
