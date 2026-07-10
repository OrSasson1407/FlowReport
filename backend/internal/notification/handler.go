package notification

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

type CreateNotificationRequest struct {
    Type    string `json:"type" binding:"required"`
    Title   string `json:"title" binding:"required"`
    Message string `json:"message"`
}

func (h *Handler) List(c *gin.Context) {
    userIDStr, _ := c.Get("user_id")
    userID, err := uuid.Parse(userIDStr.(string))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
        return
    }
    var notifications []models.Notification
    if err := h.db.Where("user_id = ?", userID).Order("created_at DESC").Limit(50).Find(&notifications).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch notifications"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"data": notifications, "count": len(notifications)})
}

func (h *Handler) Create(c *gin.Context) {
    userIDStr, _ := c.Get("user_id")
    userID, err := uuid.Parse(userIDStr.(string))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
        return
    }
    var req CreateNotificationRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    n := models.Notification{
        ID: uuid.New(), UserID: userID,
        Type: req.Type, Title: req.Title, Message: req.Message,
    }
    if err := h.db.Create(&n).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create notification"})
        return
    }
    c.JSON(http.StatusCreated, n)
}

func (h *Handler) MarkRead(c *gin.Context) {
    id, err := uuid.Parse(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid notification id"})
        return
    }
    userIDStr, _ := c.Get("user_id")
    userID, _ := uuid.Parse(userIDStr.(string))
    var n models.Notification
    if err := h.db.First(&n, "id = ? AND user_id = ?", id, userID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "notification not found"})
        return
    }
    now := time.Now()
    n.ReadAt = &now
    h.db.Save(&n)
    c.JSON(http.StatusOK, n)
}

func (h *Handler) MarkAllRead(c *gin.Context) {
    userIDStr, _ := c.Get("user_id")
    userID, _ := uuid.Parse(userIDStr.(string))
    now := time.Now()
    h.db.Model(&models.Notification{}).Where("user_id = ? AND read_at IS NULL", userID).Update("read_at", now)
    c.JSON(http.StatusOK, gin.H{"message": "all notifications marked as read"})
}

func (h *Handler) Delete(c *gin.Context) {
    userIDStr, _ := c.Get("user_id")
    userID, _ := uuid.Parse(userIDStr.(string))
    h.db.Where("user_id = ?", userID).Delete(&models.Notification{})
    c.JSON(http.StatusOK, gin.H{"message": "all notifications cleared"})
}
