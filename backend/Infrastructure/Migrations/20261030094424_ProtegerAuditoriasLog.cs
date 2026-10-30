using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ProtegerAuditoriasLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                CREATE OR REPLACE FUNCTION impedir_modificacion_auditorias()
                RETURNS trigger
                LANGUAGE plpgsql
                AS $$
                BEGIN
                RAISE EXCEPTION 'Los registros de auditoría no pueden modificarse ni eliminarse.';
                END;
                $$;

                CREATE TRIGGER trg_auditorias_inmutables
                BEFORE UPDATE OR DELETE ON "AuditoriasLog"
                FOR EACH ROW
                EXECUTE FUNCTION impedir_modificacion_auditorias();
            """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DROP TRIGGER IF EXISTS trg_auditorias_inmutables ON "AuditoriasLog";
                DROP FUNCTION IF EXISTS impedir_modificacion_auditorias();
            """);

        }
    }
}
