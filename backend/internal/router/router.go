package router

import (
    "time"

    "github.com/flowreport/backend/internal/auditlog"
    "github.com/flowreport/backend/internal/auth"
    "github.com/flowreport/backend/internal/cache"
    "github.com/flowreport/backend/internal/cycle"
    "github.com/flowreport/backend/internal/email"
    "github.com/flowreport/backend/internal/attachment"
    "github.com/flowreport/backend/internal/export"
    "github.com/flowreport/backend/internal/metrics"
    "github.com/flowreport/backend/internal/middleware"
    "github.com/flowreport/backend/internal/notification"
    "github.com/flowreport/backend/internal/report"
    "github.com/flowreport/backend/internal/user"
    "github.com/gin-contrib/cors"
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
)

// New builds the full FlowReport API router: middleware, health check, and
// every /v1 route. Used by cmd/server/main.go for the real server and by
// internal/testutil for handler tests, so both exercise identical routing.
func New(db *gorm.DB, redisCache *cache.Cache, emailSvc *email.Service, jwtSecret string) *gin.Engine {
    r := gin.Default()
    r.SetTrustedProxies(nil)
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

    authHandler := auth.NewHandler(db, jwtSecret)
    reportHandler := report.NewHandler(db, emailSvc)
    userHandler := user.NewHandler(db, jwtSecret)
    metricsHandler := metrics.NewHandler(db)
    notificationHandler := notification.NewHandler(db)
    cycleHandler := cycle.NewHandler(db)
    exportHandler := export.NewHandler(db)
    attachmentHandler := attachment.NewHandler(db)
    auditHandler := auditlog.NewHandler(db)

    v1 := r.Group("/v1")
    {
        authRoutes := v1.Group("/auth")
        {
            authRoutes.POST("/register", authHandler.Register)
            authRoutes.POST("/login", authHandler.Login)
        }

        protected := v1.Group("/")
        protected.Use(middleware.AuthRequiredWithCache(redisCache, jwtSecret))
        {
            users := protected.Group("/users")
            {
                users.GET("", userHandler.List)
                users.GET("/me", userHandler.Me)
                users.GET("/:id", userHandler.Get)
                users.POST("", userHandler.Create)
                users.PATCH("/:id", userHandler.Update)
                users.POST("/:id/impersonate", userHandler.Impersonate)
            }
            reports := protected.Group("/reports")
            {
                reports.POST("", reportHandler.Create)
                reports.GET("", reportHandler.List)
                reports.GET("/:id", reportHandler.Get)
                reports.PATCH("/:id", reportHandler.Update)
                reports.POST("/:id/submit", reportHandler.Submit)
                reports.POST("/:id/approve", reportHandler.Approve)
                reports.POST("/:id/reject", reportHandler.RequestRevision)
                reports.POST("/:id/attachments", attachmentHandler.Upload)
                reports.GET("/:id/attachments", attachmentHandler.List)
            }
            metricsRoutes := protected.Group("/metrics")
            {
                metricsRoutes.GET("/departments", metricsHandler.DepartmentMetrics)
                metricsRoutes.GET("/org-health", metricsHandler.OrgHealth)
                metricsRoutes.GET("/cycle-history", metricsHandler.CycleHistory)
                metricsRoutes.GET("/blockers", metricsHandler.EscalatedBlockers)
            }
            exportRoutes := protected.Group("/export")
            {
                exportRoutes.GET("/metrics.xlsx", exportHandler.MetricsXLSX)
            }
            attachmentRoutes := protected.Group("/attachments")
            {
                attachmentRoutes.GET("/:id", attachmentHandler.Download)
                attachmentRoutes.DELETE("/:id", attachmentHandler.Delete)
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

    return r
}