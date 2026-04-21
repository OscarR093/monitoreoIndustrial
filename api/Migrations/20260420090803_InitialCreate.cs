using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Plantas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Codigo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Plantas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TipoGraficos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Widget = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TipoGraficos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Unidades",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Simbolo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Unidades", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Areas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PlantaId = table.Column<int>(type: "integer", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Codigo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Areas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Areas_Plantas_PlantaId",
                        column: x => x.PlantaId,
                        principalTable: "Plantas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Sensores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AreaId = table.Column<int>(type: "integer", nullable: false),
                    SensorId = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Registro = table.Column<int>(type: "integer", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TipoGraficoId = table.Column<int>(type: "integer", nullable: false),
                    UnidadId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Sensores", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Sensores_Areas_AreaId",
                        column: x => x.AreaId,
                        principalTable: "Areas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Sensores_TipoGraficos_TipoGraficoId",
                        column: x => x.TipoGraficoId,
                        principalTable: "TipoGraficos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Sensores_Unidades_UnidadId",
                        column: x => x.UnidadId,
                        principalTable: "Unidades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DatosSensores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SensorId = table.Column<int>(type: "integer", nullable: false),
                    Valor = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    Timestamp = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DatosSensores", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DatosSensores_Sensores_SensorId",
                        column: x => x.SensorId,
                        principalTable: "Sensores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Plantas",
                columns: new[] { "Id", "Codigo", "CreatedAt", "Nombre" },
                values: new object[] { 1, "p1", new DateTime(2026, 4, 20, 9, 8, 3, 608, DateTimeKind.Utc).AddTicks(1166), "Planta 1" });

            migrationBuilder.InsertData(
                table: "TipoGraficos",
                columns: new[] { "Id", "Descripcion", "Nombre", "Widget" },
                values: new object[,]
                {
                    { 1, "Time Series", "línea", "line" },
                    { 2, "Indicador", "gauge", "gauge" },
                    { 3, "Barras", "bar", "bar" }
                });

            migrationBuilder.InsertData(
                table: "Unidades",
                columns: new[] { "Id", "Descripcion", "Nombre", "Simbolo" },
                values: new object[,]
                {
                    { 1, "Grados Celsius", "Temperatura", "°C" },
                    { 2, "Libras por pulgada cuadrada", "Presión", "PSI" },
                    { 3, "Voltios", "Voltaje", "V" },
                    { 4, "Amperios", "Corriente", "A" },
                    { 5, "Porcentaje", "Porcentaje", "%" },
                    { 6, "Revoluciones por minuto", "RPM", "RPM" }
                });

            migrationBuilder.InsertData(
                table: "Areas",
                columns: new[] { "Id", "Codigo", "CreatedAt", "Nombre", "PlantaId" },
                values: new object[] { 1, "a1", new DateTime(2026, 4, 20, 9, 8, 3, 608, DateTimeKind.Utc).AddTicks(1239), "Área 1", 1 });

            migrationBuilder.CreateIndex(
                name: "IX_Areas_PlantaId",
                table: "Areas",
                column: "PlantaId");

            migrationBuilder.CreateIndex(
                name: "IX_DatosSensores_SensorId",
                table: "DatosSensores",
                column: "SensorId");

            migrationBuilder.CreateIndex(
                name: "IX_DatosSensores_Timestamp",
                table: "DatosSensores",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_Plantas_Codigo",
                table: "Plantas",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Sensores_AreaId_SensorId",
                table: "Sensores",
                columns: new[] { "AreaId", "SensorId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Sensores_TipoGraficoId",
                table: "Sensores",
                column: "TipoGraficoId");

            migrationBuilder.CreateIndex(
                name: "IX_Sensores_UnidadId",
                table: "Sensores",
                column: "UnidadId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DatosSensores");

            migrationBuilder.DropTable(
                name: "Sensores");

            migrationBuilder.DropTable(
                name: "Areas");

            migrationBuilder.DropTable(
                name: "TipoGraficos");

            migrationBuilder.DropTable(
                name: "Unidades");

            migrationBuilder.DropTable(
                name: "Plantas");
        }
    }
}
