const API_BASE = 'http://localhost:8081/v1';

export interface Attachment {
  id: string;
  report_id: string;
  file_name: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('flowreport_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const attachmentsApi = {
  list: async (reportId: string): Promise<{ data: Attachment[]; count: number }> => {
    const res = await fetch(`${API_BASE}/reports/${reportId}/attachments`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to load attachments');
    return res.json();
  },
  upload: async (reportId: string, file: File): Promise<Attachment> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/reports/${reportId}/attachments`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Upload failed');
    }
    return response.json();
  },
  remove: async (attachmentId: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/attachments/${attachmentId}`, { method: 'DELETE', headers: authHeaders() });
    if (!res.ok) throw new Error('Remove failed');
  },
  download: async (attachmentId: string, fileName: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/attachments/${attachmentId}`, { headers: authHeaders() });
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};
