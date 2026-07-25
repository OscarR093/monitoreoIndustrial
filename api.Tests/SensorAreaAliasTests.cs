using System.Net;
using System.Net.Http.Json;
using api.Data;
using api.Models;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace api.Tests;

public class SensorAreaAliasTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public SensorAreaAliasTests(CustomWebApplicationFactory factory)
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

    [Fact]
    public async Task UpdateSensorAlias_Admin_Returns204AndPersistsAlias()
    {
        var client = _factory.CreateClient();
        await AuthenticateAs(client, "admin", "admin123");

        var sensor = await client.PostAsJsonAsync("/api/sensores", new Sensor
        {
            AreaId = 1,
            SensorId = "s1",
            Nombre = "Sensor 1",
            TipoGraficoId = 1,
            UnidadId = 1
        });
        Assert.Equal(HttpStatusCode.Created, sensor.StatusCode);
        var created = await sensor.Content.ReadFromJsonAsync<Sensor>();
        Assert.NotNull(created);

        var put = await client.PutAsJsonAsync($"/api/sensores/{created!.Id}", new Sensor { Alias = "Tanque Norte" });
        Assert.Equal(HttpStatusCode.NoContent, put.StatusCode);

        var get = await client.GetAsync($"/api/sensores/{created.Id}");
        Assert.Equal(HttpStatusCode.OK, get.StatusCode);
        var updated = await get.Content.ReadFromJsonAsync<Sensor>();
        Assert.Equal("Tanque Norte", updated!.Alias);
        Assert.Equal("s1", updated.SensorId);
    }

    [Fact]
    public async Task UpdateSensorAlias_Viewer_Returns403()
    {
        var sa = _factory.CreateClient();
        await AuthenticateAs(sa, "admin", "admin123");
        await sa.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Username = "viewer_alias",
            TempPassword = "temp123",
            Rol = "viewer"
        });

        var viewer = _factory.CreateClient();
        await AuthenticateAs(viewer, "viewer_alias", "temp123");

        var put = await viewer.PutAsJsonAsync("/api/sensores/1", new Sensor { Alias = "Hacked" });
        Assert.Equal(HttpStatusCode.Forbidden, put.StatusCode);
    }

    [Fact]
    public async Task UpdateAreaAlias_Admin_Returns204AndPersistsAlias()
    {
        var client = _factory.CreateClient();
        await AuthenticateAs(client, "admin", "admin123");

        var put = await client.PutAsJsonAsync("/api/areas/1", new Area { Alias = "Área de Moldeo" });
        Assert.Equal(HttpStatusCode.NoContent, put.StatusCode);

        var get = await client.GetAsync("/api/areas/1");
        Assert.Equal(HttpStatusCode.OK, get.StatusCode);
        var updated = await get.Content.ReadFromJsonAsync<Area>();
        Assert.Equal("Área de Moldeo", updated!.Alias);
        Assert.Equal("a1", updated.Codigo);
    }

    [Fact]
    public async Task UpdateAreaAlias_Viewer_Returns403()
    {
        var sa = _factory.CreateClient();
        await AuthenticateAs(sa, "admin", "admin123");
        await sa.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Username = "viewer_area",
            TempPassword = "temp123",
            Rol = "viewer"
        });

        var viewer = _factory.CreateClient();
        await AuthenticateAs(viewer, "viewer_area", "temp123");

        var put = await viewer.PutAsJsonAsync("/api/areas/1", new Area { Alias = "Hacked" });
        Assert.Equal(HttpStatusCode.Forbidden, put.StatusCode);
    }

    [Fact]
    public async Task GetAreaByPlantaCode_IncludesAlias()
    {
        var client = _factory.CreateClient();
        await AuthenticateAs(client, "admin", "admin123");
        await client.PutAsJsonAsync("/api/areas/1", new Area { Alias = "Línea de Llenado" });

        var response = await client.GetAsync("/api/areas?planta=p1");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var areas = await response.Content.ReadFromJsonAsync<List<Area>>();
        Assert.Contains(areas!, a => a.Codigo == "a1" && a.Alias == "Línea de Llenado");
    }
}
