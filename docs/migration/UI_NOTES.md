# UI Migration Notes

Discrepancies, legacy quirks, and outdated patterns identified during the React 19 port. As per migration rules, existing quirks are left as-is and documented here.

- **Chart Aspect Ratio and Canvas Dimensions**: Vanilla HTML defined hardcoded `width="400" height="250"` attributes on `<canvas>` elements while Chart.js options set `responsive: true, maintainAspectRatio: false`. In react-chartjs-2, canvases are wrapped in containers with fixed CSS heights (`250px` for daily expense/pie, `300px` for time series/day of week) matching vanilla visual proportions.
- **Analytics Month and Year Selectors**: In vanilla, month selector contains static months 01-12 regardless of whether data exists for those months, while year selector dynamically extracts years from data. Preserved exactly.
- **Autopay Day Picker "Last Day" Handling**: Vanilla maps "last day" to day 31 (clamped to the actual month's end day during transaction generation). Preserved identical behavior.
