package cycle

import (
    "net/http"
    "time"

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

type CreateCycleRequest struct {
    Year     int    `json:"year" binding:"required"`
    WeekNum  int    `json:"week_num" binding:"required"`
    StartsAt string `json:"starts_at"`
    EndsAt   string `json:"ends_at"`
    Deadline string `json:"deadline"`
}

type UpdateCycleRequest struct {
    Status   string `json:"status"`
    Deadline string `json:"deadline"`
}

func (h *Handler) List(c *gin.Context) {
    var cycles []models.ReportCycle
    if err := h.db.Order("year DESC, week_num DESC").Find(&cycles).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch cycles"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"data": cycles, "count": len(cycles)})
}

func (h *Handler) Get(c *gin.Context) {
    id, err := uuid.Parse(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid cycle id"})
        return
    }
    var cycle models.ReportCycle
    if err := h.db.First(&cycle, "id = ?", id).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "cycle not found"})
        return
    }
    c.JSON(http.StatusOK, cycle)
}

func (h *Handler) GetCurrent(c *gin.Context) {
    var cycle models.ReportCycle
    if err := h.db.Where("status = ?", "OPEN").
        Order("year DESC, week_num DESC").
        First(&cycle).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "no open cycle found"})
        return
    }
    c.JSON(http.StatusOK, cycle)
}

func (h *Handler) Create(c *gin.Context) {
    userRole, _ := c.Get("user_role")
    if userRole.(string) != "CEO" && userRole.(string) != "ADMIN" {
        c.JSON(http.StatusForbidden, gin.H{"error": "only CEO can create cycles"})
        return
    }

    var req CreateCycleRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    var startsAt, endsAt, deadline time.Time
    if req.StartsAt != "" {
        startsAt, _ = time.Parse("2006-01-02", req.StartsAt)
    }
    if req.EndsAt != "" {
        endsAt, _ = time.Parse("2006-01-02", req.EndsAt)
    }
    if req.Deadline != "" {
        deadline, _ = time.Parse("2006-01-02", req.Deadline)
    }

    cycle := models.ReportCycle{
        ID:       uuid.New(),
        Year:     req.Year,
        WeekNum:  req.WeekNum,
        StartsAt: startsAt,
        EndsAt:   endsAt,
        Deadline: deadline,
        Status:   "OPEN",
    }

    if err := h.db.Create(&cycle).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create cycle"})
        return
    }

    c.JSON(http.StatusCreated, cycle)
}

func (h *Handler) Update(c *gin.Context) {
    userRole, _ := c.Get("user_role")
    if userRole.(string) != "CEO" && userRole.(string) != "ADMIN" {
        c.JSON(http.StatusForbidden, gin.H{"error": "only CEO can update cycles"})
        return
    }

    id, err := uuid.Parse(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid cycle id"})
        return
    }

    var cycle models.ReportCycle
    if err := h.db.First(&cycle, "id = ?", id).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "cycle not found"})
        return
    }

    var req UpdateCycleRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    if req.Status != "" {
        cycle.Status = req.Status
    }
    if req.Deadline != "" {
        deadline, _ := time.Parse("2006-01-02", req.Deadline)
        cycle.Deadline = deadline
    }

    if err := h.db.Save(&cycle).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update cycle"})
        return
    }

    c.JSON(http.StatusOK, cycle)
}

func (h *Handler) Lock(c *gin.Context) {
    userRole, _ := c.Get("user_role")
    if userRole.(string) != "CEO" && userRole.(string) != "ADMIN" {
        c.JSON(http.StatusForbidden, gin.H{"error": "only CEO can lock cycles"})
        return
    }

    id, err := uuid.Parse(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid cycle id"})
        return
    }

    var cycle models.ReportCycle
    if err := h.db.First(&cycle, "id = ?", id).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "cycle not found"})
        return
    }

    cycle.Status = "LOCKED"
    if err := h.db.Save(&cycle).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to lock cycle"})
        return
    }

    c.JSON(http.StatusOK, cycle)
}

func (h *Handler) Unlock(c *gin.Context) {
    userRole, _ := c.Get("user_role")
    if userRole.(string) != "CEO" && userRole.(string) != "ADMIN" {
        c.JSON(http.StatusForbidden, gin.H{"error": "only CEO can unlock cycles"})
        return
    }

    id, err := uuid.Parse(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid cycle id"})
        return
    }

    var cycle models.ReportCycle
    if err := h.db.First(&cycle, "id = ?", id).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "cycle not found"})
        return
    }

    cycle.Status = "OPEN"
    if err := h.db.Save(&cycle).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to unlock cycle"})
        return
    }

    c.JSON(http.StatusOK, cycle)
}
