package main

import (
    "log"
    "os"

    "github.com/flowreport/backend/config"
    "github.com/flowreport/backend/internal/cache"
    "github.com/flowreport/backend/internal/database"
    "github.com/flowreport/backend/internal/email"
    "github.com/flowreport/backend/internal/router"
    "github.com/joho/godotenv"
)

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

    redisCache, err := cache.New(cfg)
    if err != nil {
        log.Printf("Warning: Redis unavailable (%v) — running without cache", err)
        redisCache = nil
    } else {
        log.Println("Redis connected successfully")
    }

    emailSvc := email.New(cfg)

    r := router.New(db, redisCache, emailSvc, cfg.JWTSecret)

    port := os.Getenv("PORT")
    if port == "" {
        port = "8081"
    }

    log.Printf("FlowReport API starting on port %s", port)
    if err := r.Run(":" + port); err != nil {
        log.Fatalf("Failed to start server: %v", err)
    }
}