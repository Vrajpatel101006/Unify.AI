using Microsoft.AspNetCore.Mvc;

namespace Unify.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly ILogger<HealthController> _logger;

    public HealthController(ILogger<HealthController> logger)
    {
        _logger = logger;
    }

    [HttpGet]
    public IActionResult GetHealth()
    {
        _logger.LogInformation("Health check endpoint hit");
        return Ok(new
        {
            Status = "Healthy",
            Timestamp = DateTime.UtcNow,
            Version = "0.1.0"
        });
    }
}
