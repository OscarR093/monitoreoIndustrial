using System.Net;
using System.Net.Http.Json;
using api.Models;
using Xunit;

namespace api.Tests;

public class AuthorizationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public AuthorizationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task AuthenticateAs(HttpClient client, string username, string password)
    {
        await client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Username = username,
            Password = password
        });
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
        await client.PutAsJsonAsync("/api/auth/complete-profile", new CompleteProfileRequest
        {
            NombreCompleto = username, Email = $"{username}@t", Telefono = "1", NuevaPassword = $"{tempPassword}2"
        });
        client = _factory.CreateClient();
        await AuthenticateAs(client, username, $"{tempPassword}2");
        return client;
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

    [Fact]
    public async Task UnauthenticatedUser_CannotAccessPlantas()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/plantas");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UnauthenticatedUser_CannotAccessSensores()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/sensores");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UnauthenticatedUser_CannotAccessDatos()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/datos");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UnauthenticatedUser_CannotAccessAreas()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/areas");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task AuthenticatedViewer_CanReadData()
    {
        var client = await PrepareViewer("readonly2", "rp");

        var endpoints = new[] { "/api/plantas", "/api/sensores", "/api/datos", "/api/areas" };
        foreach (var ep in endpoints)
        {
            var response = await client.GetAsync(ep);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
    }

    [Fact]
    public async Task Viewer_CannotCreateSensor()
    {
        var client = await PrepareViewer("vcant", "vp");

        var response = await client.PostAsJsonAsync("/api/sensores", new
        {
            areaId = 1,
            sensorId = "s1",
            nombre = "Test",
            tipoGraficoId = 1,
            unidadId = 1
        });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Viewer_CannotDeleteSensor()
    {
        var saClient = _factory.CreateClient();
        await AuthenticateAs(saClient, "admin", "admin123");

        var createResp = await saClient.PostAsJsonAsync("/api/sensores", new
        {
            areaId = 1,
            sensorId = "to-delete",
            nombre = "To Delete",
            tipoGraficoId = 1,
            unidadId = 1
        });
        var sensor = await createResp.Content.ReadFromJsonAsync<Sensor>();

        var viewerClient = await PrepareViewer("vcantdel2", "vp");

        var response = await viewerClient.DeleteAsync($"/api/sensores/{sensor!.Id}");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Admin_CanCreateSensor()
    {
        var client = await PrepareAdmin("acreate2", "ap");

        var response = await client.PostAsJsonAsync("/api/sensores", new
        {
            areaId = 1,
            sensorId = "admin-sensor",
            nombre = "Admin Created",
            tipoGraficoId = 1,
            unidadId = 1
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task SuperAdmin_CanCreateSensor()
    {
        var client = _factory.CreateClient();
        await AuthenticateAs(client, "admin", "admin123");

        var response = await client.PostAsJsonAsync("/api/sensores", new
        {
            areaId = 1,
            sensorId = "sa-sensor",
            nombre = "SA Created",
            tipoGraficoId = 1,
            unidadId = 1
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task ProfileCompletionMiddleware_BlocksBeforeCompletion()
    {
        var sa = _factory.CreateClient();
        await AuthenticateAs(sa, "admin", "admin123");
        await sa.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Username = "blocked2",
            TempPassword = "bp",
            Rol = "viewer"
        });

        var client = _factory.CreateClient();
        await AuthenticateAs(client, "blocked2", "bp");

        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/plantas")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/sensores")).StatusCode);
    }

    [Fact]
    public async Task ProfileCompletionMiddleware_AllowsLogoutBeforeCompletion()
    {
        var sa = _factory.CreateClient();
        await AuthenticateAs(sa, "admin", "admin123");
        await sa.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Username = "logoutfirst2",
            TempPassword = "lfp",
            Rol = "viewer"
        });

        var client = _factory.CreateClient();
        await AuthenticateAs(client, "logoutfirst2", "lfp");

        var response = await client.PostAsync("/api/auth/logout", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task TipoGraficoEndpoint_IsAccessible()
    {
        var client = _factory.CreateClient();
        await AuthenticateAs(client, "admin", "admin123");

        var response = await client.GetAsync("/api/tipos-grafico");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task UnidadesEndpoint_IsAccessible()
    {
        var client = _factory.CreateClient();
        await AuthenticateAs(client, "admin", "admin123");

        var response = await client.GetAsync("/api/unidades");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
