package main

import (
    "log"
    "os"
    "time"

    "github.com/flowreport/backend/config"
    "github.com/flowreport/backend/internal/auth"
    "github.com/flowreport/backend/internal/auditlog"
    "github.com/flowreport/backend/internal/cache"
    "github.com/flowreport/backend/internal/cycle"
    "github.com/flowreport/backend/internal/database"
    "github.com/flowreport/backend/internal/email"
    "github.com/flowreport/backend/internal/metrics"
    "github.com/flowreport/backend/internal/middleware"
    "github.com/flowreport/backend/internal/notification"
    "github.com/flowreport/backend/internal/report"
    "github.com/flowreport/backend/internal/user"
    "github.com/gin-contrib/cors"
    "github.com/gin-gonic/gin"
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

    r := gin.Default()
    r.Use(cors.New(cors.Config{
        AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"},
        AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
        ExposeHeaders:    []string{"Content-Length"},
        AllowCredentials: true,
        MaxAge:           12 * time.Hour,
    }))

    r.GET("/health", func(c *gin.Context) {
        c.JSON(200, gin.H{"status": "ok", "service": "flowreport-api", "redis": redisCache != nil})
    })

    authHandler         := auth.NewHandler(db)
    reportHandler       := report.NewHandler(db, emailSvc)
    userHandler         := user.NewHandler(db)
    metricsHandler      := metrics.NewHandler(db)
    notificationHandler := notification.NewHandler(db)
    cycleHandler        := cycle.NewHandler(db)
    auditHandler        := auditlog.NewHandler(db)

    v1 := r.Group("/v1")
    {
        authRoutes := v1.Group("/auth")
        {
            authRoutes.POST("/register", authHandler.Register)
            authRoutes.POST("/login", authHandler.Login)
        }

        protected := v1.Group("/")
        protected.Use(middleware.AuthRequiredWithCache(redisCache))
        {
            users := protected.Group("/users")
            {
                users.GET("", userHandler.List)
                users.GET("/me", userHandler.Me)
                users.GET("/:id", userHandler.Get)
            }
            reports := protected.Group("/reports")
            {
                reports.POST("", reportHandler.Create)
                reports.GET("", reportHandler.List)
                reports.GET("/:id", reportHandler.Get)
                reports.PATCH("/:id", reportHandler.Update)
                reports.POST("/:id/submit", reportHandler.Submit)
                reports.POST("/:id/approve", reportHandler.Approve)
            }
            metricsRoutes := protected.Group("/metrics")
            {
                metricsRoutes.GET("/departments", metricsHandler.DepartmentMetrics)
                metricsRoutes.GET("/org-health", metricsHandler.OrgHealth)
            metricsRoutes.GET("/cycle-history", metricsHandler.CycleHistory)
            }
            notifications := protected.Group("/notifications")
            {
                notifications.GET("", notificationHandler.List)
                notifications.POST("", notificationHandler.Create)
                notifications.PATCH("/:id/read", notificationHandler.MarkRead)
                notifications.POST("/read-all", notificationHandler.MarkAllRead)
                notifications.DELETE("", notificationHandler.Delete)
            }
            cycles := protected.Group("/cycles")
            {
                cycles.GET("", cycleHandler.List)
                cycles.GET("/current", cycleHandler.GetCurrent)
                cycles.GET("/:id", cycleHandler.Get)
                cycles.POST("", cycleHandler.Create)
                cycles.PATCH("/:id", cycleHandler.Update)
                cycles.POST("/:id/lock", cycleHandler.Lock)
                cycles.POST("/:id/unlock", cycleHandler.Unlock)
            }
            protected.GET("/audit-logs", auditHandler.List)
        }
    }

    port := os.Getenv("PORT")
    if port == "" {
        port = "8081"
    }

    log.Printf("FlowReport API starting on port %s", port)
    if err := r.Run(":" + port); err != nil {
        log.Fatalf("Failed to start server: %v", err)
    }
}

