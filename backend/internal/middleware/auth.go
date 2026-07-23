package middleware

import (
    "net/http"
    "strings"

    "github.com/flowreport/backend/internal/cache"
    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
)

func AuthRequired(jwtSecret string) gin.HandlerFunc {
    return authMiddleware(nil, jwtSecret)
}

func AuthRequiredWithCache(c *cache.Cache, jwtSecret string) gin.HandlerFunc {
    return authMiddleware(c, jwtSecret)
}

func authMiddleware(c *cache.Cache, jwtSecret string) gin.HandlerFunc {
    return func(ctx *gin.Context) {
        authHeader := ctx.GetHeader("Authorization")
        if authHeader == "" {
            ctx.JSON(http.StatusUnauthorized, gin.H{"error": "authorization header required"})
            ctx.Abort()
            return
        }

        parts := strings.SplitN(authHeader, " ", 2)
        if len(parts) != 2 || parts[0] != "Bearer" {
            ctx.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization header format"})
            ctx.Abort()
            return
        }

        tokenStr := parts[1]

        if c != nil {
            blacklisted, err := c.IsTokenBlacklisted(tokenStr)
            if err == nil && blacklisted {
                ctx.JSON(http.StatusUnauthorized, gin.H{"error": "token has been revoked"})
                ctx.Abort()
                return
            }
        }

        token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
            if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
                return nil, jwt.ErrSignatureInvalid
            }
            return []byte(jwtSecret), nil
        })

        if err != nil || !token.Valid {
            ctx.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
            ctx.Abort()
            return
        }

        claims, ok := token.Claims.(jwt.MapClaims)
        if !ok {
            ctx.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
            ctx.Abort()
            return
        }

        ctx.Set("user_id", claims["sub"])
        ctx.Set("user_email", claims["email"])
        ctx.Set("user_role", claims["role"])
        ctx.Next()
    }
}