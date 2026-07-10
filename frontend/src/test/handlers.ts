import { http, HttpResponse } from "msw";

const MOCK_USERS = [
  { id: "00000000-0000-0000-0000-000000000001", email: "sarah.jenkins@flowreport.com", first_name: "Sarah", last_name: "Jenkins", role: "CEO", title: "Chief Executive Officer", department: "Executive", is_active: true, created_at: "", updated_at: "" },
  { id: "00000000-0000-0000-0000-000000000002", email: "elena.rostova@flowreport.com", first_name: "Elena", last_name: "Rostova", role: "MANAGER", title: "Engineering Manager", department: "Engineering", manager_id: "00000000-0000-0000-0000-000000000001", is_active: true, created_at: "", updated_at: "" },
  { id: "00000000-0000-0000-0000-000000000003", email: "or.sasson@flowreport.com", first_name: "Or", last_name: "Sasson", role: "EMPLOYEE", title: "Senior Software Engineer", department: "Engineering", manager_id: "00000000-0000-0000-0000-000000000002", is_active: true, created_at: "", updated_at: "" },
  { id: "00000000-0000-0000-0000-000000000004", email: "ben.carter@flowreport.com", first_name: "Ben", last_name: "Carter", role: "EMPLOYEE", title: "Backend Engineer", department: "Engineering", manager_id: "00000000-0000-0000-0000-000000000002", is_active: true, created_at: "", updated_at: "" },
  { id: "00000000-0000-0000-0000-000000000005", email: "maya.levi@flowreport.com", first_name: "Maya", last_name: "Levi", role: "EMPLOYEE", title: "Frontend Engineer", department: "Engineering", manager_id: "00000000-0000-0000-0000-000000000002", is_active: true, created_at: "", updated_at: "" },
];

const MOCK_REPORT = {
  id: "rep-001", user_id: "00000000-0000-0000-0000-000000000003",
  cycle_id: "a0000000-0000-0000-0000-000000000001",
  completed_content: "", working_on_content: "",
  blockers_content: "", plans_content: "",
  status: "DRAFT", created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
};

const MOCK_CYCLE = {
  id: "a0000000-0000-0000-0000-000000000001",
  year: 2026, week_num: 26,
  starts_at: "2026-06-23", ends_at: "2026-06-29",
  deadline: "2026-06-27", status: "OPEN",
  created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
};

const MOCK_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDMiLCJlbWFpbCI6Im9yLnNhc3NvbkBmbG93cmVwb3J0LmNvbSIsInJvbGUiOiJFTVBMT1lFRSIsImV4cCI6OTk5OTk5OTk5OX0.mock";
const MOCK_TOKEN_ELENA = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDIiLCJlbWFpbCI6ImVsZW5hLnJvc3RvdmFAZmxvd3JlcG9ydC5jb20iLCJyb2xlIjoiTUFOQUdFUiIsImV4cCI6OTk5OTk5OTk5OX0.mock";
const MOCK_TOKEN_SARAH = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJlbWFpbCI6InNhcmFoLmplbmtpbnNAZmxvd3JlcG9ydC5jb20iLCJyb2xlIjoiQ0VPIiwiZXhwIjo5OTk5OTk5OTk5fQ.mock";

export const handlers = [
  http.post("http://localhost:8081/v1/auth/login", async ({ request }) => {
    const body = await request.json() as any;
    if (body.email === "or.sasson@flowreport.com") return HttpResponse.json({ token: MOCK_TOKEN, user: MOCK_USERS[2] });
    if (body.email === "elena.rostova@flowreport.com") return HttpResponse.json({ token: MOCK_TOKEN_ELENA, user: MOCK_USERS[1] });
    if (body.email === "sarah.jenkins@flowreport.com") return HttpResponse.json({ token: MOCK_TOKEN_SARAH, user: MOCK_USERS[0] });
    return HttpResponse.json({ error: "invalid credentials" }, { status: 401 });
  }),

  http.get("http://localhost:8081/v1/users", () =>
    HttpResponse.json({ data: MOCK_USERS, count: MOCK_USERS.length })),

  http.get("http://localhost:8081/v1/reports", () =>
    HttpResponse.json({ data: [MOCK_REPORT], count: 1 })),

  http.post("http://localhost:8081/v1/reports", () =>
    HttpResponse.json(MOCK_REPORT, { status: 201 })),

  http.patch("http://localhost:8081/v1/reports/:id", async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({ ...MOCK_REPORT, ...body });
  }),

  http.post("http://localhost:8081/v1/reports/:id/submit", () =>
    HttpResponse.json({ ...MOCK_REPORT, status: "SUBMITTED" })),

  http.post("http://localhost:8081/v1/reports/:id/approve", () =>
    HttpResponse.json({ ...MOCK_REPORT, status: "APPROVED" })),

  http.get("http://localhost:8081/v1/metrics/departments", () =>
    HttpResponse.json({
      data: [{ id: "Engineering", name: "Engineering", manager_name: "Elena Rostova", compliance_rate: 33, active_blocker_count: 0, total_employees: 3, submitted_count: 1, approved_count: 0, status: "CRITICAL" }],
      count: 1,
    })),

  http.get("http://localhost:8081/v1/metrics/org-health", () =>
    HttpResponse.json({ total_employees: 3, submitted_reports: 1, approved_reports: 0, overall_compliance: 33, cycle_id: "a0000000-0000-0000-0000-000000000001" })),

  http.get("http://localhost:8081/v1/notifications", () =>
    HttpResponse.json({ data: [], count: 0 })),

  http.post("http://localhost:8081/v1/notifications", async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({ id: `notif-${Date.now()}`, user_id: "mock", ...body, read_at: null, created_at: new Date().toISOString() }, { status: 201 });
  }),

  http.get("http://localhost:8081/v1/cycles/current", () =>
    HttpResponse.json(MOCK_CYCLE)),

  http.get("http://localhost:8081/v1/audit-logs", () =>
    HttpResponse.json({ data: [], count: 0 })),
];
