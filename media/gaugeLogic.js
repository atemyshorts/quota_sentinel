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

        const gaugeHtml = `
            <div class="gauge-container ${pulseClass}">
                <svg class="gauge-svg" viewBox="0 0 200 200">
                    <circle class="gauge-bg" cx="100" cy="100" r="${radius}"></circle>
                    <circle class="gauge-fill" cx="100" cy="100" r="${radius}" 
                        style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset}; stroke: ${color}"></circle>
                    <!-- Ghost segment would go here -->
                </svg>
                <div class="gauge-text">
                    <span class="percentage">${Math.round(bucket.percentage)}%</span>
                    <span class="label">${id}</span>
                </div>
            </div>
        `;

        const wrapper = document.createElement('div');
        wrapper.innerHTML = gaugeHtml;
        container.appendChild(wrapper);
    }

    // Initialize logic triggers
    // We could send a 'ready' message back to extension
})();
