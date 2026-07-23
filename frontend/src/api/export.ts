const API_BASE = 'http://localhost:8081/v1';

export async function downloadMetricsXLSX(cycleId?: string): Promise<void> {
  const token = localStorage.getItem('flowreport_token');
  const query = cycleId ? `?cycle_id=${cycleId}` : '';
  const response = await fetch(`${API_BASE}/export/metrics.xlsx${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error('Export failed');
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'flowreport_metrics.xlsx';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
