package attachment

import (
    "io"
    "net/http"
    "os"
    "path/filepath"

    "github.com/flowreport/backend/internal/models"
    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "gorm.io/gorm"
)

const maxUploadSize = 50 * 1024 * 1024 // 50MB, per PRD FR-W-002
const uploadDir = "./uploads"

type Handler struct {
    db *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler {
    os.MkdirAll(uploadDir, 0o755)
    return &Handler{db: db}
}

func (h *Handler) canAccessReport(c *gin.Context, report models.Report) bool {
    userIDStr, _ := c.Get("user_id")
    userRole, _ := c.Get("user_role")
    userID, _ := uuid.Parse(userIDStr.(string))
    switch userRole.(string) {
    case string(models.RoleCEO), string(models.RoleAdmin), string(models.RoleDirector):
        return true
    case string(models.RoleManager):
        var owner models.User
        h.db.First(&owner, "id = ?", report.UserID)
        return owner.ManagerID != nil && *owner.ManagerID == userID
    default:
        return report.UserID == userID
    }
}

// Upload handles POST /v1/reports/:id/attachments as multipart/form-data
// with a single "file" field. Enforces the 50MB cap from PRD section 4.2
// and stores the file on local disk under ./uploads/<report_id>/.
func (h *Handler) Upload(c *gin.Context) {
    reportID, err := uuid.Parse(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid report id"})
        return
    }
    var report models.Report
    if err := h.db.First(&report, "id = ?", reportID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "report not found"})
        return
    }
    if !h.canAccessReport(c, report) {
        c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
        return
    }
    fileHeader, err := c.FormFile("file")
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "no file provided"})
        return
    }
    if fileHeader.Size > maxUploadSize {
        c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "file exceeds 50MB limit"})
        return
    }
    userIDStr, _ := c.Get("user_id")
    userID, _ := uuid.Parse(userIDStr.(string))

    reportDir := filepath.Join(uploadDir, reportID.String())
    os.MkdirAll(reportDir, 0o755)
    attachmentID := uuid.New()
    storedName := attachmentID.String() + "_" + filepath.Base(fileHeader.Filename)
    destPath := filepath.Join(reportDir, storedName)

    src, err := fileHeader.Open()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read upload"})
        return
    }
    defer src.Close()
    dst, err := os.Create(destPath)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to store file"})
        return
    }
    defer dst.Close()
    if _, err := io.Copy(dst, src); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to store file"})
        return
    }

    attachment := models.Attachment{
        ID: attachmentID, ReportID: reportID, FileName: fileHeader.Filename,
        FilePath: destPath, FileSize: fileHeader.Size, UploadedBy: userID,
    }
    if err := h.db.Create(&attachment).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save attachment record"})
        return
    }
    c.JSON(http.StatusCreated, attachment)
}

// List handles GET /v1/reports/:id/attachments.
func (h *Handler) List(c *gin.Context) {
    reportID, err := uuid.Parse(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid report id"})
        return
    }
    var report models.Report
    if err := h.db.First(&report, "id = ?", reportID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "report not found"})
        return
    }
    if !h.canAccessReport(c, report) {
        c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
        return
    }
    var attachments []models.Attachment
    h.db.Where("report_id = ?", reportID).Find(&attachments)
    c.JSON(http.StatusOK, gin.H{"data": attachments, "count": len(attachments)})
}

// Download handles GET /v1/attachments/:id.
func (h *Handler) Download(c *gin.Context) {
    id, err := uuid.Parse(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid attachment id"})
        return
    }
    var attachment models.Attachment
    if err := h.db.First(&attachment, "id = ?", id).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "attachment not found"})
        return
    }
    var report models.Report
    if err := h.db.First(&report, "id = ?", attachment.ReportID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "report not found"})
        return
    }
    if !h.canAccessReport(c, report) {
        c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
        return
    }
    c.FileAttachment(attachment.FilePath, attachment.FileName)
}

// Delete handles DELETE /v1/attachments/:id — uploader-only.
func (h *Handler) Delete(c *gin.Context) {
    id, err := uuid.Parse(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid attachment id"})
        return
    }
    var attachment models.Attachment
    if err := h.db.First(&attachment, "id = ?", id).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "attachment not found"})
        return
    }
    userIDStr, _ := c.Get("user_id")
    userID, _ := uuid.Parse(userIDStr.(string))
    if attachment.UploadedBy != userID {
        c.JSON(http.StatusForbidden, gin.H{"error": "you can only remove your own attachments"})
        return
    }
    os.Remove(attachment.FilePath)
    h.db.Delete(&attachment)
    c.JSON(http.StatusOK, gin.H{"deleted": true})
}
