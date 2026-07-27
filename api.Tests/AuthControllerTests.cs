using System.Net;
using System.Net.Http.Json;
using api.Models;
using Xunit;

namespace api.Tests;

public class AuthControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public AuthControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Login_ValidCredentials_Returns200AndSetsCookie()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Username = "admin",
            Password = "admin123"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var cookies = response.Headers.GetValues("Set-Cookie").ToList();
        Assert.Contains(cookies, c => c.StartsWith("jwt="));
    }

    [Fact]
    public async Task Login_InvalidCredentials_Returns401()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Username = "nadie",
            Password = "nada"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_NonexistentUser_Returns401()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Username = "noexiste",
            Password = "password"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_ReturnsMustUpdateProfileFlag()
    {
        var client = _factory.CreateClient();
        await AuthenticateAs(client, "admin", "admin123");
        await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Username = "newviewer",
            TempPassword = "temp123",
            Rol = "viewer"
        });

        client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Username = "newviewer",
            Password = "temp123"
        });

        var loginResponse = await response.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.True(loginResponse!.MustUpdateProfile);
    }

    [Fact]
    public async Task Logout_Returns200AndClearsCookie()
    {
        var client = _factory.CreateClient();
        await AuthenticateAs(client, "admin", "admin123");

        var response = await client.PostAsync("/api/auth/logout", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Register_SuperAdminCreatesAdmin_Returns201()
    {
        var client = _factory.CreateClient();
        await AuthenticateAs(client, "admin", "admin123");

        var response = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Username = "newadmin",
            TempPassword = "adminpass",
            Rol = "admin"
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Register_AdminCreatesViewer_Returns201()
    {
        var adminClient = await PrepareAdmin("admin1", "ap");

        var response = await adminClient.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Username = "viewer_by_admin",
            TempPassword = "vp",
            Rol = "viewer"
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Register_AdminCreatesAdmin_Returns403()
    {
        var adminClient = await PrepareAdmin("admin2", "ap");

        var response = await adminClient.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Username = "admin3",
            TempPassword = "ap",
            Rol = "admin"
        });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Register_Viewer_Returns403()
    {
        var viewerClient = await PrepareViewer("v1", "vp");

        var response = await viewerClient.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Username = "bad",
            TempPassword = "x",
            Rol = "viewer"
        });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Register_DuplicateUsername_Returns409()
    {
        var client = _factory.CreateClient();
        await AuthenticateAs(client, "admin", "admin123");

        await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Username = "dupuser",
            TempPassword = "p",
            Rol = "viewer"
        });

        var response = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Username = "dupuser",
            TempPassword = "x",
            Rol = "viewer"
        });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Register_InvalidRole_Returns400()
    {
        var client = _factory.CreateClient();
        await AuthenticateAs(client, "admin", "admin123");

        var response = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Username = "bad",
            TempPassword = "x",
            Rol = "owner"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CompleteProfile_UpdatesUserAndReturnsNewJwt()
    {
        var client = await PrepareViewer("cpuser2", "temp");

        var response = await client.PutAsJsonAsync("/api/auth/complete-profile", new CompleteProfileRequest
        {
            NombreCompleto = "Complete Profile",
            Email = "cp@test.com",
            Telefono = "+1234567890",
            NuevaPassword = "newpassword123"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CompleteProfile_BlocksAfterAlreadyCompleted()
    {
        var client = await PrepareViewer("cp2", "t");

        await client.PutAsJsonAsync("/api/auth/complete-profile", new CompleteProfileRequest
        {
            NombreCompleto = "X", Email = "x@t", Telefono = "1", NuevaPassword = "np"
        });

        var response = await client.PutAsJsonAsync("/api/auth/complete-profile", new CompleteProfileRequest
        {
            NombreCompleto = "Y", Email = "y@t", Telefono = "2", NuevaPassword = "np2"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetMe_ReturnsAuthenticatedUser()
    {
        var client = _factory.CreateClient();
        await AuthenticateAs(client, "admin", "admin123");

        var response = await client.GetAsync("/api/auth/me");
        var user = await response.Content.ReadFromJsonAsync<UsuarioDto>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("admin", user!.Username);
        Assert.Equal("superadmin", user.Rol);
    }

    [Fact]
    public async Task GetMe_WithoutAuth_Returns401()
    {
        var response = await _client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UpdateMe_UpdatesProfile()
    {
        var client = _factory.CreateClient();
        await AuthenticateAs(client, "admin", "admin123");

        var response = await client.PutAsJsonAsync("/api/auth/me", new UpdateProfileRequest
        {
            NombreCompleto = "Updated Name",
            Email = "updated@test.com",
            Telefono = "+999",
            CurrentPassword = "admin123",
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var me = await client.GetFromJsonAsync<UsuarioDto>("/api/auth/me");
        Assert.Equal("Updated Name", me!.NombreCompleto);
        Assert.Equal("updated@test.com", me.Email);
        Assert.Equal("+999", me.Telefono);
    }

    [Fact]
    public async Task DeleteMe_SuperAdmin_Returns403()
    {
        var client = _factory.CreateClient();
        await AuthenticateAs(client, "admin", "admin123");

        var response = await client.DeleteAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task DeleteMe_Admin_Returns200()
    {
        var adminClient = await PrepareAdmin("delme", "p");

        var response = await adminClient.DeleteAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task DeleteMe_AdminWithCreatedUsers_Returns200()
    {
        var adminClient = await PrepareAdmin("creator", "cp2");
        await adminClient.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Username = "child_viewer",
            TempPassword = "cvp",
            Rol = "viewer"
        });

        var response = await adminClient.DeleteAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetUsers_SuperAdmin_SeesAll()
    {
        var client = _factory.CreateClient();
        await AuthenticateAs(client, "admin", "admin123");
        await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Username = "u1",
            TempPassword = "p",
            Rol = "viewer"
        });
        await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Username = "u2",
            TempPassword = "p",
            Rol = "admin"
        });

        var response = await client.GetAsync("/api/auth/users");
        var users = await response.Content.ReadFromJsonAsync<List<UsuarioDto>>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(users!.Count >= 3, $"Expected >= 3 users, got {users.Count}");
    }

    [Fact]
    public async Task GetUsers_Admin_SeesOnlyOwnViewers()
    {
        var adminClient = await PrepareAdmin($"boss_{Guid.NewGuid():N}", "bp");
        await adminClient.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Username = $"worker_{Guid.NewGuid():N}",
            TempPassword = "wp",
            Rol = "viewer"
        });

        var response = await adminClient.GetAsync("/api/auth/users");
        var users = await response.Content.ReadFromJsonAsync<List<UsuarioDto>>();

        Assert.Equal(1, users!.Count);
    }

    [Fact]
    public async Task DeleteUser_AdminDeletesOwnViewer_Returns200()
    {
        var adminClient = await PrepareAdmin("owner2", "op");
        var createResp = await adminClient.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Username = "slave",
            TempPassword = "sp",
            Rol = "viewer"
        });
        var created = await createResp.Content.ReadFromJsonAsync<UsuarioDto>();

        var response = await adminClient.DeleteAsync($"/api/auth/users/{created!.Id}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task DeleteUser_AdminDeletesOtherAdmin_Returns403()
    {
        var admASuffix = Guid.NewGuid().ToString("N");
        var admBSuffix = Guid.NewGuid().ToString("N");

        var saClient = _factory.CreateClient();
        await AuthenticateAs(saClient, "admin", "admin123");
        await saClient.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Username = $"adm_{admASuffix}", TempPassword = "ap", Rol = "admin"
        });
        await saClient.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Username = $"adm_{admBSuffix}", TempPassword = "ap", Rol = "admin"
        });

        var admAClient = await PrepareAdmin($"adm_{admASuffix}", "ap");
        var usersResp = await saClient.GetAsync("/api/auth/users");
        var allUsers = await usersResp.Content.ReadFromJsonAsync<List<UsuarioDto>>();
        var admB = allUsers!.First(u => u.Username == $"adm_{admBSuffix}");

        var response = await admAClient.DeleteAsync($"/api/auth/users/{admB.Id}");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    private async Task AuthenticateAs(HttpClient client, string username, string password)
    {
        await client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Username = username,
            Password = password
        });
    }

    private async Task<HttpClient> PrepareAdmin(string username, string tempPassword)
    {
        var sa = _factory.CreateClient();
        await AuthenticateAs(sa, "admin", "admin123");
        await sa.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Username = username,
            TempPassword = tempPassword,
            Rol = "admin"
        });

        var client = _factory.CreateClient();
        await AuthenticateAs(client, username, tempPassword);
        await client.PutAsJsonAsync("/api/auth/complete-profile", new CompleteProfileRequest
        {
            NombreCompleto = username, Email = $"{username}@t", Telefono = "1", NuevaPassword = $"{tempPassword}2"
        });
        client = _factory.CreateClient();
        await AuthenticateAs(client, username, $"{tempPassword}2");
        return client;
    }

    private async Task<HttpClient> PrepareViewer(string username, string tempPassword)
    {
        var sa = _factory.CreateClient();
        await AuthenticateAs(sa, "admin", "admin123");
        await sa.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Username = username,
            TempPassword = tempPassword,
            Rol = "viewer"
        });

        var client = _factory.CreateClient();
        await AuthenticateAs(client, username, tempPassword);
        return client;
    }
}
