package email

import (
    "fmt"
    "log"
    "strconv"

    "github.com/flowreport/backend/config"
    "gopkg.in/gomail.v2"
)

type Service struct {
    cfg     *config.Config
    enabled bool
}

func New(cfg *config.Config) *Service {
    enabled := cfg.SMTPUser != "" && cfg.SMTPPass != ""
    if !enabled {
        log.Println("Email service disabled: SMTP_USER or SMTP_PASS not set")
    } else {
        log.Printf("Email service enabled: %s via %s:%s", cfg.SMTPUser, cfg.SMTPHost, cfg.SMTPPort)
    }
    return &Service{cfg: cfg, enabled: enabled}
}

func (s *Service) Send(to, subject, body string) error {
    if !s.enabled {
        log.Printf("[EMAIL MOCK] To: %s | Subject: %s", to, subject)
        return nil
    }

    port, err := strconv.Atoi(s.cfg.SMTPPort)
    if err != nil {
        return fmt.Errorf("invalid SMTP port: %w", err)
    }

    m := gomail.NewMessage()
    m.SetHeader("From", s.cfg.SMTPFrom)
    m.SetHeader("To", to)
    m.SetHeader("Subject", subject)
    m.SetBody("text/html", body)

    d := gomail.NewDialer(s.cfg.SMTPHost, port, s.cfg.SMTPUser, s.cfg.SMTPPass)
    return d.DialAndSend(m)
}

func (s *Service) SendReportSubmitted(toEmail, firstName, weekNum string) error {
    subject := fmt.Sprintf("✅ Weekly Report Submitted — Week %s", weekNum)
    body := fmt.Sprintf(`
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#1e3a8a;padding:16px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:white;margin:0;font-size:20px">FlowReport</h1>
  </div>
  <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 8px 8px">
    <p style="color:#0f172a;font-size:16px">Hi <strong>%s</strong>,</p>
    <p style="color:#475569">Your weekly report for <strong>Week %s</strong> has been successfully submitted.</p>
    <p style="color:#475569">Your manager will review it shortly.</p>
    <div style="margin:24px 0;padding:16px;background:#f0fdf4;border:1px solid #86efac;border-radius:8px">
      <p style="color:#166534;margin:0;font-weight:600">✅ Report submitted successfully</p>
    </div>
    <p style="color:#94a3b8;font-size:12px">FlowReport — Hierarchical Distillation Platform</p>
  </div>
</div>`, firstName, weekNum)
    return s.Send(toEmail, subject, body)
}

func (s *Service) SendReportApproved(toEmail, firstName, weekNum string) error {
    subject := fmt.Sprintf("🎉 Report Approved — Week %s", weekNum)
    body := fmt.Sprintf(`
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#1e3a8a;padding:16px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:white;margin:0;font-size:20px">FlowReport</h1>
  </div>
  <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 8px 8px">
    <p style="color:#0f172a;font-size:16px">Hi <strong>%s</strong>,</p>
    <p style="color:#475569">Great news! Your weekly report for <strong>Week %s</strong> has been approved by your manager.</p>
    <div style="margin:24px 0;padding:16px;background:#eff6ff;border:1px solid #93c5fd;border-radius:8px">
      <p style="color:#1e40af;margin:0;font-weight:600">🎉 Report approved</p>
    </div>
    <p style="color:#94a3b8;font-size:12px">FlowReport — Hierarchical Distillation Platform</p>
  </div>
</div>`, firstName, weekNum)
    return s.Send(toEmail, subject, body)
}

func (s *Service) SendRevisionRequested(toEmail, firstName, weekNum, comments string) error {
    subject := fmt.Sprintf("📝 Revision Requested — Week %s", weekNum)
    body := fmt.Sprintf(`
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#1e3a8a;padding:16px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:white;margin:0;font-size:20px">FlowReport</h1>
  </div>
  <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 8px 8px">
    <p style="color:#0f172a;font-size:16px">Hi <strong>%s</strong>,</p>
    <p style="color:#475569">Your manager has requested a revision on your Week %s report.</p>
    <div style="margin:24px 0;padding:16px;background:#fefce8;border:1px solid #fde047;border-radius:8px">
      <p style="color:#854d0e;margin:0 0 8px 0;font-weight:600">📝 Manager comments:</p>
      <p style="color:#713f12;margin:0">%s</p>
    </div>
    <p style="color:#475569">Please update your report and resubmit.</p>
    <p style="color:#94a3b8;font-size:12px">FlowReport — Hierarchical Distillation Platform</p>
  </div>
</div>`, firstName, weekNum, comments)
    return s.Send(toEmail, subject, body)
}
