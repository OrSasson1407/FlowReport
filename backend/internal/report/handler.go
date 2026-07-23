package report

import (
    "net/http"
    "strconv"
    "time"

    "github.com/flowreport/backend/internal/email"
    "github.com/flowreport/backend/internal/models"
    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "gorm.io/gorm"
)

type Handler struct {
    db    *gorm.DB
    email *email.Service
}

func NewHandler(db *gorm.DB, emailSvc *email.Service) *Handler {
    return &Handler{db: db, email: emailSvc}
}

type CreateReportRequest struct {
    CycleID          string `json:"cycle_id" binding:"required"`
    CompletedContent string `json:"completed_content"`
    WorkingOnContent string `json:"working_on_content"`
    BlockersContent  string `json:"blockers_content"`
    PlansContent     string `json:"plans_content"`
}

type UpdateReportRequest struct {
    CompletedContent string `json:"completed_content"`
    WorkingOnContent string `json:"working_on_content"`
    BlockersContent  string `json:"blockers_content"`
    PlansContent     string `json:"plans_content"`
    Comments         string `json:"comments"`
}

func (h *Handler) Create(c *gin.Context) {
    var req CreateReportRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    userIDStr, _ := c.Get("user_id")
    userID, err := uuid.Parse(userIDStr.(string))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
        return
    }
    cycleID, err := uuid.Parse(req.CycleID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid cycle id"})
        return
    }
    report := models.Report{
        ID: uuid.New(), UserID: userID, CycleID: cycleID,
        CompletedContent: req.CompletedContent,
        WorkingOnContent: req.WorkingOnContent,
        BlockersContent:  req.BlockersContent,
        PlansContent:     req.PlansContent,
        Status:           models.StatusDraft,
    }
    if err := h.db.Create(&report).Error; err != nil {
        var existing models.Report
        if lookupErr := h.db.Where("user_id = ? AND cycle_id = ?", userID, cycleID).First(&existing).Error; lookupErr == nil {
            c.JSON(http.StatusOK, existing)
            return
        }
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create report"})
        return
    }
    c.JSON(http.StatusCreated, report)
}

func (h *Handler) List(c *gin.Context) {
    userIDStr, _ := c.Get("user_id")
    userRole, _  := c.Get("user_role")
    userID, err := uuid.Parse(userIDStr.(string))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
        return
    }
    var reports []models.Report
    query := h.db.Preload("User").Preload("Cycle")
    switch userRole.(string) {
    case string(models.RoleCEO), string(models.RoleAdmin), string(models.RoleDirector):
    case string(models.RoleManager):
        var directReports []models.User
        h.db.Where("manager_id = ? AND is_active = ?", userID, true).Find(&directReports)
        if len(directReports) == 0 {
            c.JSON(http.StatusOK, gin.H{"data": []models.Report{}, "count": 0})
            return
        }
        ids := make([]uuid.UUID, len(directReports))
        for i, u := range directReports { ids[i] = u.ID }
        query = query.Where("user_id IN ?", ids)
    default:
        query = query.Where("user_id = ?", userID)
    }
    if cycleID := c.Query("cycle_id"); cycleID != "" {
        query = query.Where("cycle_id = ?", cycleID)
    }
    if status := c.Query("status"); status != "" {
        query = query.Where("status = ?", status)
    }
    if err := query.Find(&reports).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch reports"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"data": reports, "count": len(reports)})
}

func (h *Handler) Get(c *gin.Context) {
    id, err := uuid.Parse(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid report id"})
        return
    }
    userIDStr, _ := c.Get("user_id")
    userRole, _  := c.Get("user_role")
    userID, _ := uuid.Parse(userIDStr.(string))
    var report models.Report
    if err := h.db.Preload("User").Preload("Cycle").First(&report, "id = ?", id).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "report not found"})
        return
    }
    switch userRole.(string) {
    case string(models.RoleCEO), string(models.RoleAdmin), string(models.RoleDirector):
    case string(models.RoleManager):
        var owner models.User
        h.db.First(&owner, "id = ?", report.UserID)
        if owner.ManagerID == nil || *owner.ManagerID != userID {
            c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
            return
        }
    default:
        if report.UserID != userID {
            c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
            return
        }
    }
    c.JSON(http.StatusOK, report)
}

func (h *Handler) Update(c *gin.Context) {
    id, err := uuid.Parse(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid report id"})
        return
    }
    userIDStr, _ := c.Get("user_id")
    userRole, _  := c.Get("user_role")
    userID, _ := uuid.Parse(userIDStr.(string))
    var report models.Report
    if err := h.db.First(&report, "id = ?", id).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "report not found"})
        return
    }
    isOwner := report.UserID == userID
    isPrivileged := userRole.(string) == string(models.RoleCEO) ||
        userRole.(string) == string(models.RoleAdmin) ||
        userRole.(string) == string(models.RoleManager)
    if !isOwner && !isPrivileged {
        c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
        return
    }
    if report.Status == models.StatusApproved {
        c.JSON(http.StatusForbidden, gin.H{"error": "cannot edit an approved report"})
        return
    }
    var req UpdateReportRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    if req.CompletedContent != "" { report.CompletedContent = req.CompletedContent }
    if req.WorkingOnContent != "" { report.WorkingOnContent = req.WorkingOnContent }
    if req.BlockersContent  != "" { report.BlockersContent  = req.BlockersContent  }
    if req.PlansContent     != "" { report.PlansContent     = req.PlansContent     }
    if req.Comments         != "" { report.Comments         = req.Comments         }
    if err := h.db.Save(&report).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update report"})
        return
    }
    c.JSON(http.StatusOK, report)
}

func (h *Handler) Submit(c *gin.Context) {
    id, err := uuid.Parse(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid report id"})
        return
    }
    userIDStr, _ := c.Get("user_id")
    userID, _ := uuid.Parse(userIDStr.(string))
    var report models.Report
    if err := h.db.First(&report, "id = ?", id).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "report not found"})
        return
    }
    if report.UserID != userID {
        c.JSON(http.StatusForbidden, gin.H{"error": "can only submit your own report"})
        return
    }
    if report.Status != models.StatusDraft && report.Status != models.StatusRevisionRequested {
        c.JSON(http.StatusBadRequest, gin.H{"error": "only draft reports can be submitted"})
        return
    }
    now := time.Now()
    report.Status = models.StatusSubmitted
    report.SubmittedAt = &now
    if err := h.db.Save(&report).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to submit report"})
        return
    }

    go func() {
        var user models.User
        if err := h.db.First(&user, "id = ?", userID).Error; err == nil {
            var cycle models.ReportCycle
            if err := h.db.First(&cycle, "id = ?", report.CycleID).Error; err == nil {
                weekNum := strconv.Itoa(cycle.WeekNum)
                if err := h.email.SendReportSubmitted(user.Email, user.FirstName, weekNum); err != nil {
                }
            }
        }
    }()

    c.JSON(http.StatusOK, report)
}

func (h *Handler) Approve(c *gin.Context) {
    id, err := uuid.Parse(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid report id"})
        return
    }
    userIDStr, _ := c.Get("user_id")
    userRole, _  := c.Get("user_role")
    userID, _ := uuid.Parse(userIDStr.(string))
    var report models.Report
    if err := h.db.First(&report, "id = ?", id).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "report not found"})
        return
    }
    switch userRole.(string) {
    case string(models.RoleCEO), string(models.RoleAdmin), string(models.RoleDirector):
    case string(models.RoleManager):
        var owner models.User
        h.db.First(&owner, "id = ?", report.UserID)
        if owner.ManagerID == nil || *owner.ManagerID != userID {
            c.JSON(http.StatusForbidden, gin.H{"error": "you can only approve your direct reports"})
            return
        }
    default:
        c.JSON(http.StatusForbidden, gin.H{"error": "only managers can approve reports"})
        return
    }
    if report.Status != models.StatusSubmitted {
        c.JSON(http.StatusBadRequest, gin.H{"error": "only submitted reports can be approved"})
        return
    }
    report.Status = models.StatusApproved
    if err := h.db.Save(&report).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to approve report"})
        return
    }

    go func() {
        var owner models.User
        if err := h.db.First(&owner, "id = ?", report.UserID).Error; err == nil {
            var cycle models.ReportCycle
            if err := h.db.First(&cycle, "id = ?", report.CycleID).Error; err == nil {
                weekNum := strconv.Itoa(cycle.WeekNum)
                h.email.SendReportApproved(owner.Email, owner.FirstName, weekNum)
            }
        }
    }()

    c.JSON(http.StatusOK, report)
}