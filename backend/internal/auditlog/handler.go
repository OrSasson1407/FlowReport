package auditlog

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

func (h *Handler) List(c *gin.Context) {
    userRole, _ := c.Get("user_role")
    if userRole.(string) != "CEO" && userRole.(string) != "ADMIN" {
        c.JSON(http.StatusForbidden, gin.H{"error": "only CEO can view audit logs"})
        return
    }

    var logs []models.AuditLog
    query := h.db.Order("timestamp DESC").Limit(100)

    if entityType := c.Query("entity_type"); entityType != "" {
        query = query.Where("entity_type = ?", entityType)
    }
    if action := c.Query("action"); action != "" {
        query = query.Where("action = ?", action)
    }

    if err := query.Find(&logs).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch audit logs"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"data": logs, "count": len(logs)})
}

func Log(db *gorm.DB, actorID uuid.UUID, action, entityType string, entityID uuid.UUID, oldState, newState, ip string) {
    entry := models.AuditLog{
        ActorID:    actorID,
        Action:     action,
        EntityType: entityType,
        EntityID:   entityID,
        OldState:   oldState,
        NewState:   newState,
        IPAddress:  ip,
    }
    db.Create(&entry)
}
