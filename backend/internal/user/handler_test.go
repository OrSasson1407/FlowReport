package user_test

import (
    "net/http"
    "testing"

    "github.com/flowreport/backend/internal/models"
    "github.com/flowreport/backend/internal/testutil"
    "github.com/golang-jwt/jwt/v5"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestList_Success(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)
    caller := testutil.CreateUser(t, db, models.RoleCEO)
    testutil.CreateUser(t, db, models.RoleEmployee)
    testutil.CreateUser(t, db, models.RoleManager)
    token := testutil.GenerateToken(t, caller)

    w := testutil.DoRequest(t, r, http.MethodGet, "/v1/users", token, nil)
    require.Equal(t, http.StatusOK, w.Code)

    var resp struct {
        Data  []models.User `json:"data"`
        Count int           `json:"count"`
    }
    testutil.DecodeJSON(t, w, &resp)
    assert.Equal(t, 3, resp.Count, "should include caller plus the 2 created users")
}

func TestList_FilterByRole(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)
    caller := testutil.CreateUser(t, db, models.RoleCEO)
    testutil.CreateUser(t, db, models.RoleEmployee)
    testutil.CreateUser(t, db, models.RoleEmployee)
    token := testutil.GenerateToken(t, caller)

    w := testutil.DoRequest(t, r, http.MethodGet, "/v1/users?role=EMPLOYEE", token, nil)
    require.Equal(t, http.StatusOK, w.Code)

    var resp struct {
        Data  []models.User `json:"data"`
        Count int           `json:"count"`
    }
    testutil.DecodeJSON(t, w, &resp)
    assert.Equal(t, 2, resp.Count)
    for _, u := range resp.Data {
        assert.Equal(t, models.RoleEmployee, u.Role)
    }
}

func TestList_FilterByDepartment(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)
    caller := testutil.CreateUser(t, db, models.RoleCEO)
    token := testutil.GenerateToken(t, caller)

    w := testutil.DoRequest(t, r, http.MethodGet, "/v1/users?department=Engineering", token, nil)
    require.Equal(t, http.StatusOK, w.Code)

    var resp struct {
        Data []models.User `json:"data"`
    }
    testutil.DecodeJSON(t, w, &resp)
    for _, u := range resp.Data {
        assert.Equal(t, "Engineering", u.Department)
    }
}

func TestList_RequiresAuth(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)

    w := testutil.DoRequest(t, r, http.MethodGet, "/v1/users", "", nil)
    assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestGet_Success(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)
    caller := testutil.CreateUser(t, db, models.RoleCEO)
    target := testutil.CreateUser(t, db, models.RoleEmployee)
    token := testutil.GenerateToken(t, caller)

    w := testutil.DoRequest(t, r, http.MethodGet, "/v1/users/"+target.ID.String(), token, nil)
    require.Equal(t, http.StatusOK, w.Code)

    var got models.User
    testutil.DecodeJSON(t, w, &got)
    assert.Equal(t, target.ID, got.ID)
    assert.Equal(t, target.Email, got.Email)
}

func TestGet_NotFound(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)
    caller := testutil.CreateUser(t, db, models.RoleCEO)
    token := testutil.GenerateToken(t, caller)

    w := testutil.DoRequest(t, r, http.MethodGet, "/v1/users/00000000-0000-0000-0000-000000000999", token, nil)
    assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestGet_InvalidID(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)
    caller := testutil.CreateUser(t, db, models.RoleCEO)
    token := testutil.GenerateToken(t, caller)

    w := testutil.DoRequest(t, r, http.MethodGet, "/v1/users/not-a-uuid", token, nil)
    assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestMe_Success(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)
    caller := testutil.CreateUser(t, db, models.RoleManager)
    token := testutil.GenerateToken(t, caller)

    w := testutil.DoRequest(t, r, http.MethodGet, "/v1/users/me", token, nil)
    require.Equal(t, http.StatusOK, w.Code)

    var got models.User
    testutil.DecodeJSON(t, w, &got)
    assert.Equal(t, caller.ID, got.ID)
}

func TestCreate_AsCEO_Success(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)
    ceo := testutil.CreateUser(t, db, models.RoleCEO)
    token := testutil.GenerateToken(t, ceo)

    body := map[string]any{
        "email": "onboarded@flowreport.test", "password": "password123",
        "first_name": "New", "last_name": "Manager", "role": "MANAGER",
        "title": "Engineering Manager", "department": "Engineering",
    }
    w := testutil.DoRequest(t, r, http.MethodPost, "/v1/users", token, body)
    require.Equal(t, http.StatusCreated, w.Code)

    var created models.User
    testutil.DecodeJSON(t, w, &created)
    assert.Equal(t, models.RoleManager, created.Role)
    assert.Empty(t, created.Password)
}

func TestCreate_AsAdmin_Success(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)
    admin := testutil.CreateUser(t, db, models.RoleAdmin)
    token := testutil.GenerateToken(t, admin)

    body := map[string]any{
        "email": "admin-onboarded@flowreport.test", "password": "password123",
        "first_name": "New", "last_name": "Director", "role": "DIRECTOR",
    }
    w := testutil.DoRequest(t, r, http.MethodPost, "/v1/users", token, body)
    assert.Equal(t, http.StatusCreated, w.Code)
}

func TestCreate_AsEmployee_Forbidden(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)
    employee := testutil.CreateUser(t, db, models.RoleEmployee)
    token := testutil.GenerateToken(t, employee)

    body := map[string]any{
        "email": "unauthorized@flowreport.test", "password": "password123",
        "first_name": "Should", "last_name": "Fail", "role": "CEO",
    }
    w := testutil.DoRequest(t, r, http.MethodPost, "/v1/users", token, body)
    assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestCreate_AsManager_Forbidden(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)
    manager := testutil.CreateUser(t, db, models.RoleManager)
    token := testutil.GenerateToken(t, manager)

    body := map[string]any{
        "email": "manager-cant-create@flowreport.test", "password": "password123",
        "first_name": "Should", "last_name": "Fail", "role": "EMPLOYEE",
    }
    w := testutil.DoRequest(t, r, http.MethodPost, "/v1/users", token, body)
    assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestCreate_DuplicateEmail(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)
    ceo := testutil.CreateUser(t, db, models.RoleCEO)
    token := testutil.GenerateToken(t, ceo)

    body := map[string]any{
        "email": ceo.Email, "password": "password123",
        "first_name": "Dupe", "last_name": "Email", "role": "EMPLOYEE",
    }
    w := testutil.DoRequest(t, r, http.MethodPost, "/v1/users", token, body)
    assert.Equal(t, http.StatusConflict, w.Code)
}

func TestCreate_WithManagerID(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)
    ceo := testutil.CreateUser(t, db, models.RoleCEO)
    manager := testutil.CreateUser(t, db, models.RoleManager)
    token := testutil.GenerateToken(t, ceo)

    body := map[string]any{
        "email": "reports-to-manager@flowreport.test", "password": "password123",
        "first_name": "Reports", "last_name": "ToManager", "role": "EMPLOYEE",
        "manager_id": manager.ID.String(),
    }
    w := testutil.DoRequest(t, r, http.MethodPost, "/v1/users", token, body)
    require.Equal(t, http.StatusCreated, w.Code)

    var created models.User
    testutil.DecodeJSON(t, w, &created)
    require.NotNil(t, created.ManagerID)
    assert.Equal(t, manager.ID, *created.ManagerID)
}

func TestCreate_InvalidManagerID(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)
    ceo := testutil.CreateUser(t, db, models.RoleCEO)
    token := testutil.GenerateToken(t, ceo)

    body := map[string]any{
        "email": "bad-manager@flowreport.test", "password": "password123",
        "first_name": "Bad", "last_name": "Manager", "role": "EMPLOYEE",
        "manager_id": "not-a-uuid",
    }
    w := testutil.DoRequest(t, r, http.MethodPost, "/v1/users", token, body)
    assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestImpersonate_AsCEO_Success(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)
    ceo := testutil.CreateUser(t, db, models.RoleCEO)
    target := testutil.CreateUser(t, db, models.RoleEmployee)
    token := testutil.GenerateToken(t, ceo)

    w := testutil.DoRequest(t, r, http.MethodPost, "/v1/users/"+target.ID.String()+"/impersonate", token, nil)
    require.Equal(t, http.StatusOK, w.Code)

    var resp struct {
        Token string      `json:"token"`
        User  models.User `json:"user"`
    }
    testutil.DecodeJSON(t, w, &resp)
    assert.Equal(t, target.ID, resp.User.ID)
    assert.NotEmpty(t, resp.Token)

    parsed, err := jwt.Parse(resp.Token, func(token *jwt.Token) (interface{}, error) {
        return []byte(testutil.TestJWTSecret), nil
    })
    require.NoError(t, err)
    claims := parsed.Claims.(jwt.MapClaims)
    assert.Equal(t, target.ID.String(), claims["sub"])
    assert.Equal(t, ceo.ID.String(), claims["impersonated_by"], "token must record who initiated the impersonation")
}

func TestImpersonate_AsAdmin_Success(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)
    admin := testutil.CreateUser(t, db, models.RoleAdmin)
    target := testutil.CreateUser(t, db, models.RoleManager)
    token := testutil.GenerateToken(t, admin)

    w := testutil.DoRequest(t, r, http.MethodPost, "/v1/users/"+target.ID.String()+"/impersonate", token, nil)
    assert.Equal(t, http.StatusOK, w.Code)
}

func TestImpersonate_AsEmployee_Forbidden(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)
    employee := testutil.CreateUser(t, db, models.RoleEmployee)
    target := testutil.CreateUser(t, db, models.RoleManager)
    token := testutil.GenerateToken(t, employee)

    w := testutil.DoRequest(t, r, http.MethodPost, "/v1/users/"+target.ID.String()+"/impersonate", token, nil)
    assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestImpersonate_AsManager_Forbidden(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)
    manager := testutil.CreateUser(t, db, models.RoleManager)
    target := testutil.CreateUser(t, db, models.RoleEmployee)
    token := testutil.GenerateToken(t, manager)

    w := testutil.DoRequest(t, r, http.MethodPost, "/v1/users/"+target.ID.String()+"/impersonate", token, nil)
    assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestImpersonate_UnknownTarget(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)
    ceo := testutil.CreateUser(t, db, models.RoleCEO)
    token := testutil.GenerateToken(t, ceo)

    w := testutil.DoRequest(t, r, http.MethodPost, "/v1/users/00000000-0000-0000-0000-000000000999/impersonate", token, nil)
    assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestImpersonate_TokenWorksForTargetUser(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)
    ceo := testutil.CreateUser(t, db, models.RoleCEO)
    target := testutil.CreateUser(t, db, models.RoleEmployee)
    ceoToken := testutil.GenerateToken(t, ceo)

    w := testutil.DoRequest(t, r, http.MethodPost, "/v1/users/"+target.ID.String()+"/impersonate", ceoToken, nil)
    require.Equal(t, http.StatusOK, w.Code)

    var resp struct {
        Token string `json:"token"`
    }
    testutil.DecodeJSON(t, w, &resp)

    meResp := testutil.DoRequest(t, r, http.MethodGet, "/v1/users/me", resp.Token, nil)
    require.Equal(t, http.StatusOK, meResp.Code)

    var me models.User
    testutil.DecodeJSON(t, meResp, &me)
    assert.Equal(t, target.ID, me.ID)
}