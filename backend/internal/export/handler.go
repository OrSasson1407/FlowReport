package export

import (
    "fmt"
    "net/http"
    "strings"
    "time"

    "github.com/flowreport/backend/internal/models"
    "github.com/gin-gonic/gin"
    "github.com/xuri/excelize/v2"
    "gorm.io/gorm"
)

type Handler struct {
    db *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler {
    return &Handler{db: db}
}

// MetricsXLSX implements PRD section 10.2: a two-sheet Excel workbook
// (Executive Summary + Granular Blocker Log) with conditional red
// highlighting for departments below 80% compliance and for blockers
// flagged CRITICAL. CEO/Admin/Director only.
func (h *Handler) MetricsXLSX(c *gin.Context) {
    role, _ := c.Get("user_role")
    switch role.(string) {
    case string(models.RoleCEO), string(models.RoleAdmin), string(models.RoleDirector):
    default:
        c.JSON(http.StatusForbidden, gin.H{"error": "only executives can export company metrics"})
        return
    }

    cycleID := c.Query("cycle_id")
    if cycleID == "" {
        cycleID = "a0000000-0000-0000-0000-000000000001"
    }

    var employees []models.User
    h.db.Where("is_active = ? AND role = ?", true, models.RoleEmployee).Find(&employees)
    var reports []models.Report
    h.db.Preload("User").Where("cycle_id = ?", cycleID).Find(&reports)

    reportMap := make(map[string]models.Report)
    for _, r := range reports {
        reportMap[r.UserID.String()] = r
    }
    deptMap := make(map[string][]models.User)
    for _, e := range employees {
        deptMap[e.Department] = append(deptMap[e.Department], e)
    }

    f := excelize.NewFile()
    defer f.Close()

    summarySheet := "Executive Summary"
    f.SetSheetName("Sheet1", summarySheet)
    headers := []string{"Department Code", "Total FTE", "Compliance Rate %", "Active Blocker Count", "Health Index"}
    for i, hdr := range headers {
        cell, _ := excelize.CoordinatesToCellName(i+1, 1)
        f.SetCellValue(summarySheet, cell, hdr)
    }
    redStyle, _ := f.NewStyle(&excelize.Style{Fill: excelize.Fill{Type: "pattern", Color: []string{"#FCA5A5"}, Pattern: 1}})

    row := 2
    for dept, emps := range deptMap {
        total, submitted, blockers := len(emps), 0, 0
        for _, e := range emps {
            r, ok := reportMap[e.ID.String()]
            if !ok {
                continue
            }
            if r.Status == models.StatusSubmitted || r.Status == models.StatusApproved {
                submitted++
            }
            if r.BlockersContent != "" {
                blockers++
            }
        }
        compliance := 0.0
        if total > 0 {
            compliance = float64(submitted) / float64(total) * 100
        }
        health := compliance - float64(blockers)*5
        f.SetCellValue(summarySheet, fmt.Sprintf("A%d", row), dept)
        f.SetCellValue(summarySheet, fmt.Sprintf("B%d", row), total)
        f.SetCellValue(summarySheet, fmt.Sprintf("C%d", row), compliance)
        f.SetCellValue(summarySheet, fmt.Sprintf("D%d", row), blockers)
        f.SetCellValue(summarySheet, fmt.Sprintf("E%d", row), health)
        if compliance < 80 {
            f.SetCellStyle(summarySheet, fmt.Sprintf("C%d", row), fmt.Sprintf("C%d", row), redStyle)
        }
        row++
    }

    blockerSheet := "Granular Blocker Log"
    f.NewSheet(blockerSheet)
    blockerHeaders := []string{"User", "Department", "Blocker Text", "Age (Days)", "Escalation Status"}
    for i, hdr := range blockerHeaders {
        cell, _ := excelize.CoordinatesToCellName(i+1, 1)
        f.SetCellValue(blockerSheet, cell, hdr)
    }
    brow := 2
    for _, r := range reports {
        if r.BlockersContent == "" {
            continue
        }
        isCritical := strings.Contains(strings.ToUpper(r.BlockersContent), "CRITICAL")
        status := "Normal"
        if isCritical {
            status = "CRITICAL"
        }
        ref := r.CreatedAt
        if r.SubmittedAt != nil {
            ref = *r.SubmittedAt
        }
        daysActive := int(time.Since(ref).Hours() / 24)
        f.SetCellValue(blockerSheet, fmt.Sprintf("A%d", brow), r.User.FirstName+" "+r.User.LastName)
        f.SetCellValue(blockerSheet, fmt.Sprintf("B%d", brow), r.User.Department)
        f.SetCellValue(blockerSheet, fmt.Sprintf("C%d", brow), r.BlockersContent)
        f.SetCellValue(blockerSheet, fmt.Sprintf("D%d", brow), daysActive)
        f.SetCellValue(blockerSheet, fmt.Sprintf("E%d", brow), status)
        if isCritical {
            f.SetCellStyle(blockerSheet, fmt.Sprintf("E%d", brow), fmt.Sprintf("E%d", brow), redStyle)
        }
        brow++
    }

    c.Header("Content-Disposition", "attachment; filename=flowreport_metrics.xlsx")
    c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    if err := f.Write(c.Writer); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate workbook"})
    }
}
