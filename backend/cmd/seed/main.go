package main

import (
    "log"

    "github.com/flowreport/backend/config"
    "github.com/flowreport/backend/internal/database"
    "github.com/flowreport/backend/internal/models"
    "github.com/google/uuid"
    "github.com/joho/godotenv"
    "golang.org/x/crypto/bcrypt"
    "gorm.io/gorm"
)

func hashPassword(password string) string {
    hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    if err != nil {
        log.Fatalf("Failed to hash password: %v", err)
    }
    return string(hashed)
}

func seedUsers(db *gorm.DB) {
    ceoID     := uuid.MustParse("00000000-0000-0000-0000-000000000001")
    managerID := uuid.MustParse("00000000-0000-0000-0000-000000000002")
    emp1ID    := uuid.MustParse("00000000-0000-0000-0000-000000000003")
    emp2ID    := uuid.MustParse("00000000-0000-0000-0000-000000000004")
    emp3ID    := uuid.MustParse("00000000-0000-0000-0000-000000000005")

    users := []models.User{
        {ID: ceoID, Email: "sarah.jenkins@flowreport.com", Password: hashPassword("password123"), FirstName: "Sarah", LastName: "Jenkins", Role: models.RoleCEO, Title: "Chief Executive Officer", Department: "Executive", IsActive: true},
        {ID: managerID, Email: "elena.rostova@flowreport.com", Password: hashPassword("password123"), FirstName: "Elena", LastName: "Rostova", Role: models.RoleManager, Title: "Engineering Manager", Department: "Engineering", ManagerID: &ceoID, IsActive: true},
        {ID: emp1ID, Email: "or.sasson@flowreport.com", Password: hashPassword("password123"), FirstName: "Or", LastName: "Sasson", Role: models.RoleEmployee, Title: "Senior Software Engineer", Department: "Engineering", ManagerID: &managerID, IsActive: true},
        {ID: emp2ID, Email: "ben.carter@flowreport.com", Password: hashPassword("password123"), FirstName: "Ben", LastName: "Carter", Role: models.RoleEmployee, Title: "Backend Engineer", Department: "Engineering", ManagerID: &managerID, IsActive: true},
        {ID: emp3ID, Email: "maya.levi@flowreport.com", Password: hashPassword("password123"), FirstName: "Maya", LastName: "Levi", Role: models.RoleEmployee, Title: "Frontend Engineer", Department: "Engineering", ManagerID: &managerID, IsActive: true},
    }

    for _, u := range users {
        result := db.Where("email = ?", u.Email).FirstOrCreate(&u)
        if result.Error != nil {
            log.Printf("Failed to seed user %s: %v", u.Email, result.Error)
        } else {
            log.Printf("Seeded user: %s %s (%s)", u.FirstName, u.LastName, u.Role)
        }
    }
}

func seedCycle(db *gorm.DB) {
    cycle := models.ReportCycle{
        ID: uuid.MustParse("a0000000-0000-0000-0000-000000000001"),
        Year: 2026, WeekNum: 26, Status: "OPEN",
    }
    db.Where("id = ?", cycle.ID).FirstOrCreate(&cycle)
    log.Println("Seeded report cycle: Week 26 2026")
}

func main() {
    if err := godotenv.Load(); err != nil {
        log.Println("No .env file found, using environment variables")
    }
    cfg := config.Load()
    db, err := database.Connect(cfg)
    if err != nil {
        log.Fatalf("Failed to connect to database: %v", err)
    }
    if err := database.Migrate(db); err != nil {
        log.Fatalf("Failed to run migrations: %v", err)
    }
    log.Println("Starting database seed...")
    seedUsers(db)
    seedCycle(db)
    log.Println("Database seed complete!")
}
