package testutil

import (
    "bytes"
    "encoding/json"
    "net/http/httptest"
    "os"
    "testing"
    "time"

    "github.com/flowreport/backend/config"
    "github.com/flowreport/backend/internal/database"
    "github.com/flowreport/backend/internal/email"
    "github.com/flowreport/backend/internal/models"
    "github.com/flowreport/backend/internal/router"
    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
    "github.com/google/uuid"
    "golang.org/x/crypto/bcrypt"
    "gorm.io/gorm"
)

const TestJWTSecret = "test-jwt-secret-for-backend-tests-only-not-for-real-use"

func envOr(key, fallback string) string {
    if v := os.Getenv(key); v != "" {
        return v
    }
    return fallback
}

func testConfig() *config.Config {
    return &config.Config{
        DBHost:     envOr("TEST_DB_HOST", "localhost"),
        DBPort:     envOr("TEST_DB_PORT", "5439"),
        DBUser:     envOr("TEST_DB_USER", "postgres"),
        DBPassword: envOr("TEST_DB_PASSWORD", "postgres"),
        DBName:     envOr("TEST_DB_NAME", "flowreport_test"),
        DBSSLMode:  "disable",
        JWTSecret:  TestJWTSecret,
        RedisHost:  "localhost",
        RedisPort:  "6399",
    }
}

func SetupDB(t *testing.T) *gorm.DB {
    t.Helper()
    cfg := testConfig()
    db, err := database.Connect(cfg)
    if err != nil {
        t.Fatalf("testutil: failed to connect to test database %q: %v (did you create it? see testutil.go comment)", cfg.DBName, err)
    }
    if err := database.Migrate(db); err != nil {
        t.Fatalf("testutil: failed to migrate test database: %v", err)
    }
    return db
}

func TruncateAll(t *testing.T, db *gorm.DB) {
    t.Helper()
    if err := db.Exec(`TRUNCATE TABLE reports, notifications, audit_logs, users, report_cycles RESTART IDENTITY CASCADE`).Error; err != nil {
        t.Fatalf("testutil: failed to truncate test tables: %v", err)
    }
}

func CreateUser(t *testing.T, db *gorm.DB, role models.UserRole) models.User {
    t.Helper()
    hashed, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
    if err != nil {
        t.Fatalf("testutil: failed to hash password: %v", err)
    }
    user := models.User{
        ID:         uuid.New(),
        Email:      "test-" + uuid.New().String() + "@flowreport.test",
        Password:   string(hashed),
        FirstName:  "Test",
        LastName:   string(role),
        Role:       role,
        Department: "Engineering",
        IsActive:   true,
    }
    if err := db.Create(&user).Error; err != nil {
        t.Fatalf("testutil: failed to create test user: %v", err)
    }
    return user
}

func CreateUserWithManager(t *testing.T, db *gorm.DB, role models.UserRole, managerID uuid.UUID) models.User {
    t.Helper()
    user := CreateUser(t, db, role)
    user.ManagerID = &managerID
    if err := db.Save(&user).Error; err != nil {
        t.Fatalf("testutil: failed to set manager on test user: %v", err)
    }
    return user
}

func CreateCycle(t *testing.T, db *gorm.DB) models.ReportCycle {
    t.Helper()
    now := time.Now()
    cycle := models.ReportCycle{
        ID:       uuid.New(),
        Year:     now.Year(),
        WeekNum:  1,
        StartsAt: now,
        EndsAt:   now.Add(7 * 24 * time.Hour),
        Deadline: now.Add(5 * 24 * time.Hour),
        Status:   "OPEN",
    }
    if err := db.Create(&cycle).Error; err != nil {
        t.Fatalf("testutil: failed to create test cycle: %v", err)
    }
    return cycle
}

func GenerateToken(t *testing.T, user models.User) string {
    t.Helper()
    claims := jwt.MapClaims{
        "sub":   user.ID.String(),
        "email": user.Email,
        "role":  user.Role,
        "exp":   time.Now().Add(1 * time.Hour).Unix(),
        "iat":   time.Now().Unix(),
    }
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    signed, err := token.SignedString([]byte(TestJWTSecret))
    if err != nil {
        t.Fatalf("testutil: failed to sign test token: %v", err)
    }
    return signed
}

func NewRouter(db *gorm.DB) *gin.Engine {
    gin.SetMode(gin.TestMode)
    emailSvc := email.New(testConfig())
    return router.New(db, nil, emailSvc, TestJWTSecret)
}

func DoRequest(t *testing.T, r *gin.Engine, method, path, token string, body any) *httptest.ResponseRecorder {
    t.Helper()
    var reqBody *bytes.Buffer
    if body != nil {
        b, err := json.Marshal(body)
        if err != nil {
            t.Fatalf("testutil: failed to marshal request body: %v", err)
        }
        reqBody = bytes.NewBuffer(b)
    } else {
        reqBody = bytes.NewBuffer(nil)
    }
    req := httptest.NewRequest(method, path, reqBody)
    req.Header.Set("Content-Type", "application/json")
    if token != "" {
        req.Header.Set("Authorization", "Bearer "+token)
    }
    w := httptest.NewRecorder()
    r.ServeHTTP(w, req)
    return w
}

func DecodeJSON(t *testing.T, w *httptest.ResponseRecorder, target any) {
    t.Helper()
    if err := json.Unmarshal(w.Body.Bytes(), target); err != nil {
        t.Fatalf("testutil: failed to decode JSON response (status %d, body %q): %v", w.Code, w.Body.String(), err)
    }
}