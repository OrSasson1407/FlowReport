package cache

import (
    "context"
    "fmt"
    "time"

    "github.com/flowreport/backend/config"
    "github.com/redis/go-redis/v9"
)

var ctx = context.Background()

type Cache struct {
    client *redis.Client
}

func New(cfg *config.Config) (*Cache, error) {
    client := redis.NewClient(&redis.Options{
        Addr: fmt.Sprintf("%s:%s", cfg.RedisHost, cfg.RedisPort),
    })
    if err := client.Ping(ctx).Err(); err != nil {
        return nil, fmt.Errorf("failed to connect to Redis: %w", err)
    }
    return &Cache{client: client}, nil
}

func (c *Cache) Set(key string, value string, ttl time.Duration) error {
    return c.client.Set(ctx, key, value, ttl).Err()
}

func (c *Cache) Get(key string) (string, error) {
    return c.client.Get(ctx, key).Result()
}

func (c *Cache) Delete(key string) error {
    return c.client.Del(ctx, key).Err()
}

func (c *Cache) Exists(key string) (bool, error) {
    n, err := c.client.Exists(ctx, key).Result()
    return n > 0, err
}

func (c *Cache) SetUserProfile(userID string, data string) error {
    return c.Set(fmt.Sprintf("user:%s", userID), data, 10*time.Minute)
}

func (c *Cache) GetUserProfile(userID string) (string, error) {
    return c.Get(fmt.Sprintf("user:%s", userID))
}

func (c *Cache) InvalidateUserProfile(userID string) error {
    return c.Delete(fmt.Sprintf("user:%s", userID))
}

func (c *Cache) BlacklistToken(token string) error {
    return c.Set(fmt.Sprintf("blacklist:%s", token), "1", 24*time.Hour)
}

func (c *Cache) IsTokenBlacklisted(token string) (bool, error) {
    return c.Exists(fmt.Sprintf("blacklist:%s", token))
}

func (c *Cache) SetOrgTree(data string) error {
    return c.Set("org:tree", data, 5*time.Minute)
}

func (c *Cache) GetOrgTree() (string, error) {
    return c.Get("org:tree")
}
