using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class RenameUnidadOnOff : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Unidades",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "Descripcion", "Nombre", "Simbolo" },
                values: new object[] { "Estado digital encendido/apagado", "ON/OFF", "ON/OFF" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Unidades",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "Descripcion", "Nombre", "Simbolo" },
                values: new object[] { "Valor booleano 0/1", "Binario", "BOOL" });
        }
    }
}
