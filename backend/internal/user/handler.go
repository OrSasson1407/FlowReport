package user

import (
    "net/http"
    "time"

    "github.com/flowreport/backend/internal/auditlog"
    "github.com/flowreport/backend/internal/models"
    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
    "github.com/google/uuid"
    "golang.org/x/crypto/bcrypt"
    "gorm.io/gorm"
)

type Handler struct {
    db        *gorm.DB
    jwtSecret string
}

func NewHandler(db *gorm.DB, jwtSecret string) *Handler {
    return &Handler{db: db, jwtSecret: jwtSecret}
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

type CreateUserRequest struct {
    Email      string          `json:"email" binding:"required,email"`
    Password   string          `json:"password" binding:"required,min=6"`
    FirstName  string          `json:"first_name" binding:"required"`
    LastName   string          `json:"last_name" binding:"required"`
    Role       models.UserRole `json:"role" binding:"required"`
    Title      string          `json:"title"`
    Department string          `json:"department"`
    ManagerID  string          `json:"manager_id"`
}

// Create is an admin-only endpoint (CEO/ADMIN) for onboarding users with any
// role, per the PRD's "Administrator configures the org tree" story. Public
// self-registration (/v1/auth/register) always creates EMPLOYEE accounts.
func (h *Handler) Create(c *gin.Context) {
    userRole, _ := c.Get("user_role")
    if userRole.(string) != string(models.RoleCEO) && userRole.(string) != string(models.RoleAdmin) {
        c.JSON(http.StatusForbidden, gin.H{"error": "only CEO or ADMIN can create users"})
        return
    }

    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
        return
    }

    newUser := models.User{
        ID:         uuid.New(),
        Email:      req.Email,
        Password:   string(hashed),
        FirstName:  req.FirstName,
        LastName:   req.LastName,
        Role:       req.Role,
        Title:      req.Title,
        Department: req.Department,
        IsActive:   true,
    }
    if req.ManagerID != "" {
        managerID, err := uuid.Parse(req.ManagerID)
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "invalid manager_id"})
            return
        }
        newUser.ManagerID = &managerID
    }

    if err := h.db.Create(&newUser).Error; err != nil {
        c.JSON(http.StatusConflict, gin.H{"error": "email already exists"})
        return
    }

    c.JSON(http.StatusCreated, newUser)
}

type ImpersonateResponse struct {
    Token string      `json:"token"`
    User  models.User `json:"user"`
}

// Impersonate is a CEO/ADMIN-only endpoint that issues a short-lived token
// scoped to the target user, so an admin can view the app as that user.
// Every use is written to the immutable audit log. This replaces the old
// mock-era frontend "persona switcher", which changed the displayed user
// client-side with no backend authorization at all.
func (h *Handler) Impersonate(c *gin.Context) {
    actorRole, _ := c.Get("user_role")
    if actorRole.(string) != string(models.RoleCEO) && actorRole.(string) != string(models.RoleAdmin) {
        c.JSON(http.StatusForbidden, gin.H{"error": "only CEO or ADMIN can view as another user"})
        return
    }

    actorIDStr, _ := c.Get("user_id")
    actorID, err := uuid.Parse(actorIDStr.(string))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid actor id"})
        return
    }

    targetID, err := uuid.Parse(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
        return
    }

    var target models.User
    if err := h.db.First(&target, "id = ?", targetID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
        return
    }

    claims := jwt.MapClaims{
        "sub":             target.ID.String(),
        "email":           target.Email,
        "role":            target.Role,
        "impersonated_by": actorID.String(),
        "exp":             time.Now().Add(1 * time.Hour).Unix(),
        "iat":             time.Now().Unix(),
    }
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    signed, err := token.SignedString([]byte(h.jwtSecret))
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
        return
    }

    auditlog.Log(h.db, actorID, "USER_IMPERSONATION_STARTED", "user", target.ID, "", "", c.ClientIP())

    target.Password = ""
    c.JSON(http.StatusOK, ImpersonateResponse{Token: signed, User: target})
}
func (h *Handler) wouldCreateCycle(userID, newManagerID uuid.UUID) bool {
    currentID := newManagerID
    visited := map[uuid.UUID]bool{}
    for {
        if currentID == userID {
            return true
        }
        if visited[currentID] {
            return false
        }
        visited[currentID] = true
        var current models.User
        if err := h.db.Select("manager_id").First(&current, "id = ?", currentID).Error; err != nil {
            return false
        }
        if current.ManagerID == nil {
            return false
        }
        currentID = *current.ManagerID
    }
}

type UpdateUserRequest struct {
    Role       *models.UserRole `json:"role"`
    Title      *string          `json:"title"`
    Department *string          `json:"department"`
    ManagerID  *string          `json:"manager_id"`
    IsActive   *bool            `json:"is_active"`
}

// Update is an admin-only endpoint (CEO/ADMIN) for editing org-tree structure:
// reassigning a manager, changing role/department, or deactivating a user.
// Per REQ-4.1.1, any manager_id change is validated with a DFS walk up the
// existing chain to reject moves that would create a circular reporting loop.
func (h *Handler) Update(c *gin.Context) {
    actorRole, _ := c.Get("user_role")
    if actorRole.(string) != string(models.RoleCEO) && actorRole.(string) != string(models.RoleAdmin) {
        c.JSON(http.StatusForbidden, gin.H{"error": "only CEO or ADMIN can update org structure"})
        return
    }
    targetID, err := uuid.Parse(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
        return
    }
    var target models.User
    if err := h.db.First(&target, "id = ?", targetID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
        return
    }
    var req UpdateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    if req.ManagerID != nil {
        if *req.ManagerID == "" {
            target.ManagerID = nil
        } else {
            newManagerID, err := uuid.Parse(*req.ManagerID)
            if err != nil {
                c.JSON(http.StatusBadRequest, gin.H{"error": "invalid manager_id"})
                return
            }
            if newManagerID == targetID {
                c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "a user cannot manage themselves"})
                return
            }
            if h.wouldCreateCycle(targetID, newManagerID) {
                c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "this assignment would create a circular reporting loop"})
                return
            }
            target.ManagerID = &newManagerID
        }
    }
    if req.Role != nil {
        target.Role = *req.Role
    }
    if req.Title != nil {
        target.Title = *req.Title
    }
    if req.Department != nil {
        target.Department = *req.Department
    }
    if req.IsActive != nil {
        target.IsActive = *req.IsActive
    }
    if err := h.db.Save(&target).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update user"})
        return
    }
    c.JSON(http.StatusOK, target)
}
