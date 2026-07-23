package models

import (
    "time"

    "github.com/google/uuid"
    "gorm.io/gorm"
)

type UserRole string

const (
    RoleEmployee UserRole = "EMPLOYEE"
    RoleManager  UserRole = "MANAGER"
    RoleDirector UserRole = "DIRECTOR"
    RoleAdmin    UserRole = "ADMIN"
    RoleCEO      UserRole = "CEO"
)

type User struct {
    ID         uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
    Email      string         `gorm:"uniqueIndex;not null" json:"email"`
    Password   string         `gorm:"not null" json:"-"`
    FirstName  string         `gorm:"not null" json:"first_name"`
    LastName   string         `gorm:"not null" json:"last_name"`
    Role       UserRole       `gorm:"not null" json:"role"`
    Title      string         `json:"title"`
    Department string         `json:"department"`
    ManagerID  *uuid.UUID     `gorm:"type:uuid" json:"manager_id,omitempty"`
    IsActive   bool           `gorm:"default:true" json:"is_active"`
    CreatedAt  time.Time      `json:"created_at"`
    UpdatedAt  time.Time      `json:"updated_at"`
    DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}

type ReportCycle struct {
    ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
    Year      int       `gorm:"not null" json:"year"`
    WeekNum   int       `gorm:"not null" json:"week_num"`
    StartsAt  time.Time `json:"starts_at"`
    EndsAt    time.Time `json:"ends_at"`
    Deadline  time.Time `json:"deadline"`
    Status    string    `gorm:"default:OPEN" json:"status"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

type ReportStatus string

const (
    StatusDraft             ReportStatus = "DRAFT"
    StatusSubmitted         ReportStatus = "SUBMITTED"
    StatusApproved          ReportStatus = "APPROVED"
    StatusRevisionRequested ReportStatus = "REVISION_REQUESTED"
)

type Report struct {
    ID               uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
    UserID           uuid.UUID      `gorm:"type:uuid;not null;index;uniqueIndex:idx_reports_user_cycle" json:"user_id"`
    User             User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
    CycleID          uuid.UUID      `gorm:"type:uuid;not null;index;uniqueIndex:idx_reports_user_cycle" json:"cycle_id"`
    Cycle            ReportCycle    `gorm:"foreignKey:CycleID" json:"cycle,omitempty"`
    CompletedContent string         `gorm:"type:text" json:"completed_content"`
    WorkingOnContent string         `gorm:"type:text" json:"working_on_content"`
    BlockersContent  string         `gorm:"type:text" json:"blockers_content"`
    PlansContent     string         `gorm:"type:text" json:"plans_content"`
    Status           ReportStatus   `gorm:"default:DRAFT" json:"status"`
    Comments         string         `gorm:"type:text" json:"comments,omitempty"`
    SubmittedAt      *time.Time     `json:"submitted_at,omitempty"`
    CreatedAt        time.Time      `json:"created_at"`
    UpdatedAt        time.Time      `json:"updated_at"`
    DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
}

type Notification struct {
    ID        uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
    UserID    uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
    Type      string     `gorm:"not null" json:"type"`
    Title     string     `gorm:"not null" json:"title"`
    Message   string     `gorm:"type:text" json:"message"`
    ReadAt    *time.Time `json:"read_at,omitempty"`
    CreatedAt time.Time  `json:"created_at"`
}

type AuditLog struct {
    ID         uint      `gorm:"primaryKey;autoIncrement" json:"id"`
    ActorID    uuid.UUID `gorm:"type:uuid" json:"actor_id"`
    Action     string    `gorm:"not null" json:"action"`
    EntityType string    `json:"entity_type"`
    EntityID   uuid.UUID `gorm:"type:uuid" json:"entity_id"`
    OldState   string    `gorm:"type:jsonb" json:"old_state,omitempty"`
    NewState   string    `gorm:"type:jsonb" json:"new_state,omitempty"`
    IPAddress  string    `json:"ip_address,omitempty"`
    Timestamp  time.Time `gorm:"default:now()" json:"timestamp"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
    if u.ID == uuid.Nil {
        u.ID = uuid.New()
    }
    return nil
}

func (r *Report) BeforeCreate(tx *gorm.DB) error {
    if r.ID == uuid.Nil {
        r.ID = uuid.New()
    }
    return nil
}

func (rc *ReportCycle) BeforeCreate(tx *gorm.DB) error {
    if rc.ID == uuid.Nil {
        rc.ID = uuid.New()
    }
    return nil
}

func (n *Notification) BeforeCreate(tx *gorm.DB) error {
    if n.ID == uuid.Nil {
        n.ID = uuid.New()
    }
    return nil
}