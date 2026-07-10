package metrics

import (
    "net/http"

    "github.com/flowreport/backend/internal/models"
    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "gorm.io/gorm"
)

type Handler struct {
    db *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler {
    return &Handler{db: db}
}

type DepartmentMetric struct {
    ID               string  `json:"id"`
    Name             string  `json:"name"`
    ManagerName      string  `json:"manager_name"`
    ComplianceRate   float64 `json:"compliance_rate"`
    ActiveBlockerCount int   `json:"active_blocker_count"`
    TotalEmployees   int     `json:"total_employees"`
    SubmittedCount   int     `json:"submitted_count"`
    ApprovedCount    int     `json:"approved_count"`
    Status           string  `json:"status"`
}

func (h *Handler) DepartmentMetrics(c *gin.Context) {
    cycleID := c.Query("cycle_id")
    if cycleID == "" {
        cycleID = "a0000000-0000-0000-0000-000000000001"
    }

    parsedCycleID, err := uuid.Parse(cycleID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid cycle_id"})
        return
    }

    // Get all active employees grouped by department
    var employees []models.User
    h.db.Where("is_active = ? AND role = ?", true, models.RoleEmployee).Find(&employees)

    // Get all reports for this cycle
    var reports []models.Report
    h.db.Where("cycle_id = ?", parsedCycleID).Find(&reports)

    // Build a map of user_id -> report
    reportMap := make(map[uuid.UUID]models.Report)
    for _, r := range reports {
        reportMap[r.UserID] = r
    }

    // Group employees by department
    deptMap := make(map[string][]models.User)
    for _, e := range employees {
        deptMap[e.Department] = append(deptMap[e.Department], e)
    }

    // Get managers
    var managers []models.User
    h.db.Where("is_active = ? AND role = ?", true, models.RoleManager).Find(&managers)
    managerByDept := make(map[string]models.User)
    for _, m := range managers {
        managerByDept[m.Department] = m
    }

    var result []DepartmentMetric
    for dept, emps := range deptMap {
        total := len(emps)
        submitted := 0
        approved := 0
        blockers := 0

        for _, e := range emps {
            r, hasReport := reportMap[e.ID]
            if !hasReport {
                continue
            }
            if r.Status == models.StatusSubmitted || r.Status == models.StatusApproved {
                submitted++
            }
            if r.Status == models.StatusApproved {
                approved++
            }
            if r.BlockersContent != "" {
                blockers++
            }
        }

        compliance := 0.0
        if total > 0 {
            compliance = float64(submitted) / float64(total) * 100
        }

        status := "OPTIMAL"
        if compliance < 50 {
            status = "CRITICAL"
        } else if compliance < 80 {
            status = "WARNING"
        }

        managerName := "N/A"
        if m, ok := managerByDept[dept]; ok {
            managerName = m.FirstName + " " + m.LastName
        }

        result = append(result, DepartmentMetric{
            ID:                 dept,
            Name:               dept,
            ManagerName:        managerName,
            ComplianceRate:     compliance,
            ActiveBlockerCount: blockers,
            TotalEmployees:     total,
            SubmittedCount:     submitted,
            ApprovedCount:      approved,
            Status:             status,
        })
    }

    c.JSON(http.StatusOK, gin.H{"data": result, "count": len(result)})
}

func (h *Handler) OrgHealth(c *gin.Context) {
    cycleID := c.Query("cycle_id")
    if cycleID == "" {
        cycleID = "a0000000-0000-0000-0000-000000000001"
    }

    var totalEmployees int64
    h.db.Model(&models.User{}).Where("is_active = ? AND role = ?", true, models.RoleEmployee).Count(&totalEmployees)

    var submittedReports int64
    h.db.Model(&models.Report{}).Where("cycle_id = ? AND status IN ?", cycleID, []string{"SUBMITTED", "APPROVED"}).Count(&submittedReports)

    var approvedReports int64
    h.db.Model(&models.Report{}).Where("cycle_id = ? AND status = ?", cycleID, "APPROVED").Count(&approvedReports)

    overallCompliance := 0.0
    if totalEmployees > 0 {
        overallCompliance = float64(submittedReports) / float64(totalEmployees) * 100
    }

    c.JSON(http.StatusOK, gin.H{
        "total_employees":    totalEmployees,
        "submitted_reports":  submittedReports,
        "approved_reports":   approvedReports,
        "overall_compliance": overallCompliance,
        "cycle_id":           cycleID,
    })
}
