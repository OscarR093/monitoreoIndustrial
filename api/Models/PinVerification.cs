namespace api.Models;

public class PinVerification
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public string Pin { get; set; } = string.Empty;
    public DateTime ExpiraEn { get; set; }
    public bool Usado { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
