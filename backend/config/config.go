package config

import "os"

type Config struct {
    DBHost     string
    DBPort     string
    DBUser     string
    DBPassword string
    DBName     string
    DBSSLMode  string
    JWTSecret  string
    Port       string
    RedisHost  string
    RedisPort  string
    SMTPHost   string
    SMTPPort   string
    SMTPUser   string
    SMTPPass   string
    SMTPFrom   string
}

func Load() *Config {
    return &Config{
        DBHost:     getEnv("DB_HOST", "localhost"),
        DBPort:     getEnv("DB_PORT", "5432"),
        DBUser:     getEnv("DB_USER", "postgres"),
        DBPassword: getEnv("DB_PASSWORD", "postgres"),
        DBName:     getEnv("DB_NAME", "flowreport"),
        DBSSLMode:  getEnv("DB_SSLMODE", "disable"),
        JWTSecret:  getEnv("JWT_SECRET", "changeme-super-secret-key"),
        Port:       getEnv("PORT", "8081"),
        RedisHost:  getEnv("REDIS_HOST", "localhost"),
        RedisPort:  getEnv("REDIS_PORT", "6399"),
        SMTPHost:   getEnv("SMTP_HOST", "smtp.gmail.com"),
        SMTPPort:   getEnv("SMTP_PORT", "587"),
        SMTPUser:   getEnv("SMTP_USER", ""),
        SMTPPass:   getEnv("SMTP_PASS", ""),
        SMTPFrom:   getEnv("SMTP_FROM", "FlowReport <noreply@flowreport.com>"),
    }
}

func getEnv(key, fallback string) string {
    if val := os.Getenv(key); val != "" {
        return val
    }
    return fallback
}
