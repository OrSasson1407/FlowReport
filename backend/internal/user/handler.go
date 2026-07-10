package user

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
    var users []models.User
    query := h.db.Where("is_active = ?", true)

    if role := c.Query("role"); role != "" {
        query = query.Where("role = ?", role)
    }
    if dept := c.Query("department"); dept != "" {
        query = query.Where("department = ?", dept)
    }

    if err := query.Find(&users).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch users"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"data": users, "count": len(users)})
}

func (h *Handler) Get(c *gin.Context) {
    id, err := uuid.Parse(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
        return
    }

    var user models.User
    if err := h.db.First(&user, "id = ?", id).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
        return
    }

    c.JSON(http.StatusOK, user)
}

func (h *Handler) Me(c *gin.Context) {
    userIDStr, _ := c.Get("user_id")
    userID, err := uuid.Parse(userIDStr.(string))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
        return
    }

    var user models.User
    if err := h.db.First(&user, "id = ?", userID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
        return
    }

    c.JSON(http.StatusOK, user)
}
