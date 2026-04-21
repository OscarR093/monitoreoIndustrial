using Microsoft.EntityFrameworkCore;
using api.Models;

namespace api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Planta> Plantas => Set<Planta>();
    public DbSet<Area> Areas => Set<Area>();
    public DbSet<TipoGrafico> TipoGraficos => Set<TipoGrafico>();
    public DbSet<Unidad> Unidades => Set<Unidad>();
    public DbSet<Sensor> Sensores => Set<Sensor>();
    public DbSet<DatoSensor> DatosSensores => Set<DatoSensor>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Planta>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nombre).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Codigo).IsRequired().HasMaxLength(20);
            entity.HasIndex(e => e.Codigo).IsUnique();
        });

        modelBuilder.Entity<Area>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nombre).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Codigo).IsRequired().HasMaxLength(20);
            entity.HasOne(e => e.Planta)
                  .WithMany(p => p.Areas)
                  .HasForeignKey(e => e.PlantaId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TipoGrafico>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nombre).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Descripcion).HasMaxLength(200);
            entity.Property(e => e.Widget).IsRequired().HasMaxLength(50);
        });

        modelBuilder.Entity<Unidad>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nombre).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Simbolo).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Descripcion).HasMaxLength(200);
        });

        modelBuilder.Entity<Sensor>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.SensorId).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Nombre).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => new { e.AreaId, e.SensorId }).IsUnique();
            entity.HasOne(e => e.Area)
                  .WithMany(a => a.Sensores)
                  .HasForeignKey(e => e.AreaId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.TipoGrafico)
                  .WithMany(t => t.Sensores)
                  .HasForeignKey(e => e.TipoGraficoId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Unidad)
                  .WithMany(u => u.Sensores)
                  .HasForeignKey(e => e.UnidadId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<DatoSensor>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Valor).HasPrecision(10, 2);
            entity.HasOne(e => e.Sensor)
                  .WithMany(s => s.Datos)
                  .HasForeignKey(e => e.SensorId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.SensorId);
            entity.HasIndex(e => e.Timestamp);
        });

        SeedData(modelBuilder);
    }

    private static readonly DateTime FixedDate = new DateTime(2026, 4, 20, 9, 8, 3, DateTimeKind.Utc);

    private void SeedData(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Planta>().HasData(
            new Planta { Id = 1, Nombre = "Planta 1", Codigo = "p1", CreatedAt = FixedDate }
        );

        modelBuilder.Entity<Area>().HasData(
            new Area { Id = 1, PlantaId = 1, Nombre = "Área 1", Codigo = "a1", CreatedAt = FixedDate }
        );

        modelBuilder.Entity<TipoGrafico>().HasData(
            new TipoGrafico { Id = 1, Nombre = "línea", Descripcion = "Time Series", Widget = "line" },
            new TipoGrafico { Id = 2, Nombre = "gauge", Descripcion = "Indicador", Widget = "gauge" },
            new TipoGrafico { Id = 3, Nombre = "bar", Descripcion = "Barras", Widget = "bar" }
        );

        modelBuilder.Entity<Unidad>().HasData(
            new Unidad { Id = 1, Nombre = "Temperatura", Simbolo = "°C", Descripcion = "Grados Celsius" },
            new Unidad { Id = 2, Nombre = "Presión", Simbolo = "PSI", Descripcion = "Libras por pulgada cuadrada" },
            new Unidad { Id = 3, Nombre = "Voltaje", Simbolo = "V", Descripcion = "Voltios" },
            new Unidad { Id = 4, Nombre = "Corriente", Simbolo = "A", Descripcion = "Amperios" },
            new Unidad { Id = 5, Nombre = "Porcentaje", Simbolo = "%", Descripcion = "Porcentaje" },
            new Unidad { Id = 6, Nombre = "RPM", Simbolo = "RPM", Descripcion = "Revoluciones por minuto" }
        );
    }
}
