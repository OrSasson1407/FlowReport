package auth

import (
"net/http"
"os"
"time"

"github.com/flowreport/backend/internal/models"
"github.com/gin-gonic/gin"
"github.com/golang-jwt/jwt/v5"
"github.com/google/uuid"
"gorm.io/gorm"
"golang.org/x/crypto/bcrypt"
)

type Handler struct {
db *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler {
return &Handler{db: db}
}

type RegisterRequest struct {
Email      string          `json:"email" binding:"required,email"`
Password   string          `json:"password" binding:"required,min=6"`
FirstName  string          `json:"first_name" binding:"required"`
LastName   string          `json:"last_name" binding:"required"`
Role       models.UserRole `json:"role" binding:"required"`
Title      string          `json:"title"`
Department string          `json:"department"`
}

type LoginRequest struct {
Email    string `json:"email" binding:"required,email"`
Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
Token string      `json:"token"`
User  models.User `json:"user"`
}

func (h *Handler) Register(c *gin.Context) {
var req RegisterRequest
if err := c.ShouldBindJSON(&req); err != nil {
c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
return
}

hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
if err != nil {
c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
return
}

user := models.User{
ID:         uuid.New(),
Email:      req.Email,
Password:   string(hashed),
FirstName:  req.FirstName,
LastName:   req.LastName,
Role:       req.Role,
Title:      req.Title,
Department: req.Department,
}

if err := h.db.Create(&user).Error; err != nil {
c.JSON(http.StatusConflict, gin.H{"error": "email already exists"})
return
}

token, err := generateToken(user)
if err != nil {
c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
return
}

user.Password = ""
c.JSON(http.StatusCreated, AuthResponse{Token: token, User: user})
}

func (h *Handler) Login(c *gin.Context) {
var req LoginRequest
if err := c.ShouldBindJSON(&req); err != nil {
c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
return
}

var user models.User
if err := h.db.Where("email = ?", req.Email).First(&user).Error; err != nil {
c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
return
}

if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
return
}

token, err := generateToken(user)
if err != nil {
c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
return
}

user.Password = ""
c.JSON(http.StatusOK, AuthResponse{Token: token, User: user})
}

func generateToken(user models.User) (string, error) {
secret := os.Getenv("JWT_SECRET")
if secret == "" {
secret = "changeme-super-secret-key"
}

claims := jwt.MapClaims{
"sub":   user.ID.String(),
"email": user.Email,
"role":  user.Role,
"exp":   time.Now().Add(24 * time.Hour).Unix(),
"iat":   time.Now().Unix(),
}

token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
return token.SignedString([]byte(secret))
}
