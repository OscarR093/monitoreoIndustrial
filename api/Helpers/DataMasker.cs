namespace api.Helpers;

public static class DataMasker
{
    public static string? Mask(string? value, string field)
    {
        if (string.IsNullOrEmpty(value)) return value;

        return field switch
        {
            "email" => MaskEmail(value),
            "telefono" => MaskPhone(value),
            _ => value,
        };
    }

    public static string MaskEmail(string email)
    {
        var atIndex = email.IndexOf('@');
        if (atIndex <= 0) return "***@" + MaskDomain(email.Substring(1));
        var local = email.Substring(0, atIndex);
        var domain = email.Substring(atIndex + 1);
        var maskedLocal = local.Length <= 2 ? "***" : local[0] + "***";
        return maskedLocal + "@" + MaskDomain(domain);
    }

    public static string MaskPhone(string phone)
    {
        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (digits.Length < 5) return new string('*', digits.Length);
        return "***" + digits[^3..];
    }

    private static string MaskDomain(string domain)
    {
        var dotIndex = domain.LastIndexOf('.');
        if (dotIndex <= 0) return "****";
        return domain[0] + "****." + domain[(dotIndex + 1)..];
    }
}
