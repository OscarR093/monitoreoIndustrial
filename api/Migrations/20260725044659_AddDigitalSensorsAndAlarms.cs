using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddDigitalSensorsAndAlarms : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AlarmaActiva",
                table: "Sensores",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AlarmaEnOff",
                table: "Sensores",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AlarmaEnOn",
                table: "Sensores",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "RangoMaximo",
                table: "Sensores",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "RangoMinimo",
                table: "Sensores",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TipoDato",
                table: "Sensores",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "analogico");

            migrationBuilder.AddColumn<DateTime>(
                name: "UltimaAlarmaEnviada",
                table: "Sensores",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Cambios",
                table: "DatosSensores",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "ConfiguracionesAlarma",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Tipo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ConfigJson = table.Column<string>(type: "text", nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false),
                    CreadoPorId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConfiguracionesAlarma", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ConfiguracionesAlarma_Usuarios_CreadoPorId",
                        column: x => x.CreadoPorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.InsertData(
                table: "TipoGraficos",
                columns: new[] { "Id", "Descripcion", "Nombre", "Widget" },
                values: new object[] { 4, "Estado ON/OFF", "Digital", "status" });

            migrationBuilder.InsertData(
                table: "Unidades",
                columns: new[] { "Id", "Descripcion", "Nombre", "Simbolo" },
                values: new object[] { 7, "Valor booleano 0/1", "Binario", "BOOL" });

            migrationBuilder.CreateIndex(
                name: "IX_ConfiguracionesAlarma_CreadoPorId",
                table: "ConfiguracionesAlarma",
                column: "CreadoPorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ConfiguracionesAlarma");

            migrationBuilder.DeleteData(
                table: "TipoGraficos",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Unidades",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DropColumn(
                name: "AlarmaActiva",
                table: "Sensores");

            migrationBuilder.DropColumn(
                name: "AlarmaEnOff",
                table: "Sensores");

            migrationBuilder.DropColumn(
                name: "AlarmaEnOn",
                table: "Sensores");

            migrationBuilder.DropColumn(
                name: "RangoMaximo",
                table: "Sensores");

            migrationBuilder.DropColumn(
                name: "RangoMinimo",
                table: "Sensores");

            migrationBuilder.DropColumn(
                name: "TipoDato",
                table: "Sensores");

            migrationBuilder.DropColumn(
                name: "UltimaAlarmaEnviada",
                table: "Sensores");

            migrationBuilder.DropColumn(
                name: "Cambios",
                table: "DatosSensores");
        }
    }
}
