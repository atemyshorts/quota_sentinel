(function () {
    const vscode = acquireVsCodeApi();

    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'quota-update':
                updateAllGauges(message.buckets);
                break;
            case 'ping':
                console.log('Ping received:', message.value);
                break;
        }
    });

    function updateAllGauges(buckets) {
        const container = document.getElementById('gauges-root');
        container.innerHTML = ''; // Clear for now, optimized re-render later

        for (const [id, bucket] of Object.entries(buckets)) {
            createOrUpdateGauge(container, id, bucket);
        }
    }

    function createOrUpdateGauge(container, id, bucket) {
        // Simple implementation: regenerate SVG each time (Phase 3 spec)
        // In production, we'd diff and update attributes.

        const radius = 90;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (bucket.percentage / 100) * circumference;

        let color = 'var(--accent-primary)';
        let pulseClass = '';

        if (bucket.percentage > 85) {
            color = 'var(--accent-critical)';
            pulseClass = 'pulsing-critical';
        } else if (bucket.percentage > 70) {
            color = 'var(--accent-warning)';
            pulseClass = 'pulsing-warning';
        }

        // Security Fix: Prevent XSS by building DOM elements instead of raw HTML string for user-controlled data
        const gaugeContainer = document.createElement('div');
        gaugeContainer.className = `gauge-container ${pulseClass}`;
        gaugeContainer.innerHTML = `
                <svg class="gauge-svg" viewBox="0 0 200 200">
                    <circle class="gauge-bg" cx="100" cy="100" r="${radius}"></circle>
                    <circle class="gauge-fill" cx="100" cy="100" r="${radius}" 
                        style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset}; stroke: ${color}"></circle>
                </svg>
                <div class="gauge-text">
                    <span class="percentage">${Math.round(bucket.percentage)}%</span>
                    <span class="label"></span>
                </div>
        `;
        // Safely set text content for the label
        gaugeContainer.querySelector('.label').textContent = id;

        container.appendChild(gaugeContainer);

    }

    // Initialize logic triggers
    document.addEventListener('DOMContentLoaded', () => {
        vscode.postMessage({ type: 'ready' });
    });
})();
