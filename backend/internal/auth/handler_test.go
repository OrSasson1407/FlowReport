package auth_test

import (
    "net/http"
    "testing"

    "github.com/flowreport/backend/internal/models"
    "github.com/flowreport/backend/internal/testutil"
    "github.com/golang-jwt/jwt/v5"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestRegister_Success(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)

    body := map[string]any{
        "email": "newuser@flowreport.test", "password": "password123",
        "first_name": "New", "last_name": "User",
    }
    w := testutil.DoRequest(t, r, http.MethodPost, "/v1/auth/register", "", body)
    require.Equal(t, http.StatusCreated, w.Code)

    var resp struct {
        Token string      `json:"token"`
        User  models.User `json:"user"`
    }
    testutil.DecodeJSON(t, w, &resp)
    assert.NotEmpty(t, resp.Token)
    assert.Equal(t, "newuser@flowreport.test", resp.User.Email)
    assert.Equal(t, models.RoleEmployee, resp.User.Role)
    assert.Empty(t, resp.User.Password, "password hash must never be returned in the response")
}

func TestRegister_IgnoresClientSuppliedRole(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)

    body := map[string]any{
        "email": "escalation@flowreport.test", "password": "password123",
        "first_name": "Would-Be", "last_name": "Admin", "role": "CEO",
    }
    w := testutil.DoRequest(t, r, http.MethodPost, "/v1/auth/register", "", body)
    require.Equal(t, http.StatusCreated, w.Code)

    var resp struct {
        User models.User `json:"user"`
    }
    testutil.DecodeJSON(t, w, &resp)
    assert.Equal(t, models.RoleEmployee, resp.User.Role, "self-registration must never grant an elevated role, even if requested")
}

func TestRegister_DuplicateEmail(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)

    body := map[string]any{
        "email": "dupe@flowreport.test", "password": "password123",
        "first_name": "First", "last_name": "User",
    }
    w1 := testutil.DoRequest(t, r, http.MethodPost, "/v1/auth/register", "", body)
    require.Equal(t, http.StatusCreated, w1.Code)

    w2 := testutil.DoRequest(t, r, http.MethodPost, "/v1/auth/register", "", body)
    assert.Equal(t, http.StatusConflict, w2.Code)
}

func TestRegister_InvalidEmail(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)

    body := map[string]any{
        "email": "not-an-email", "password": "password123",
        "first_name": "Bad", "last_name": "Email",
    }
    w := testutil.DoRequest(t, r, http.MethodPost, "/v1/auth/register", "", body)
    assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestRegister_ShortPassword(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)

    body := map[string]any{
        "email": "shortpw@flowreport.test", "password": "abc",
        "first_name": "Short", "last_name": "Password",
    }
    w := testutil.DoRequest(t, r, http.MethodPost, "/v1/auth/register", "", body)
    assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestRegister_MissingRequiredFields(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)

    cases := []map[string]any{
        {"password": "password123", "first_name": "No", "last_name": "Email"},
        {"email": "nopw@flowreport.test", "first_name": "No", "last_name": "Password"},
        {"email": "nofn@flowreport.test", "password": "password123", "last_name": "NoFirstName"},
        {"email": "noln@flowreport.test", "password": "password123", "first_name": "NoLastName"},
    }
    for _, body := range cases {
        w := testutil.DoRequest(t, r, http.MethodPost, "/v1/auth/register", "", body)
        assert.Equal(t, http.StatusBadRequest, w.Code, "expected 400 for incomplete body: %+v", body)
    }
}

func TestLogin_Success(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)
    user := testutil.CreateUser(t, db, models.RoleEmployee)

    body := map[string]any{"email": user.Email, "password": "password123"}
    w := testutil.DoRequest(t, r, http.MethodPost, "/v1/auth/login", "", body)
    require.Equal(t, http.StatusOK, w.Code)

    var resp struct {
        Token string      `json:"token"`
        User  models.User `json:"user"`
    }
    testutil.DecodeJSON(t, w, &resp)
    assert.NotEmpty(t, resp.Token)
    assert.Equal(t, user.ID, resp.User.ID)
    assert.Empty(t, resp.User.Password)
}

func TestLogin_WrongPassword(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)
    user := testutil.CreateUser(t, db, models.RoleEmployee)

    body := map[string]any{"email": user.Email, "password": "wrong-password"}
    w := testutil.DoRequest(t, r, http.MethodPost, "/v1/auth/login", "", body)
    assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestLogin_UnknownEmail(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)

    body := map[string]any{"email": "nobody@flowreport.test", "password": "password123"}
    w := testutil.DoRequest(t, r, http.MethodPost, "/v1/auth/login", "", body)
    assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestLogin_MissingFields(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)

    w1 := testutil.DoRequest(t, r, http.MethodPost, "/v1/auth/login", "", map[string]any{"password": "password123"})
    assert.Equal(t, http.StatusBadRequest, w1.Code)

    w2 := testutil.DoRequest(t, r, http.MethodPost, "/v1/auth/login", "", map[string]any{"email": "someone@flowreport.test"})
    assert.Equal(t, http.StatusBadRequest, w2.Code)
}

func TestLogin_TokenContainsExpectedClaims(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)
    user := testutil.CreateUser(t, db, models.RoleManager)

    body := map[string]any{"email": user.Email, "password": "password123"}
    w := testutil.DoRequest(t, r, http.MethodPost, "/v1/auth/login", "", body)
    require.Equal(t, http.StatusOK, w.Code)

    var resp struct {
        Token string `json:"token"`
    }
    testutil.DecodeJSON(t, w, &resp)

    parsed, err := jwt.Parse(resp.Token, func(token *jwt.Token) (interface{}, error) {
        return []byte(testutil.TestJWTSecret), nil
    })
    require.NoError(t, err)
    require.True(t, parsed.Valid)

    claims, ok := parsed.Claims.(jwt.MapClaims)
    require.True(t, ok)
    assert.Equal(t, user.ID.String(), claims["sub"])
    assert.Equal(t, user.Email, claims["email"])
    assert.Equal(t, string(models.RoleManager), claims["role"])
}

func TestLogin_RejectsTokenSignedWithWrongSecret(t *testing.T) {
    db := testutil.SetupDB(t)
    testutil.TruncateAll(t, db)
    r := testutil.NewRouter(db)

    claims := jwt.MapClaims{"sub": "forged", "email": "forged@flowreport.test", "role": "CEO"}
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    forged, err := token.SignedString([]byte("wrong-secret-not-the-real-one"))
    require.NoError(t, err)

    w := testutil.DoRequest(t, r, http.MethodGet, "/v1/users/me", forged, nil)
    assert.Equal(t, http.StatusUnauthorized, w.Code)
}