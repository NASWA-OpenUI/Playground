using System.Text.Json.Serialization;

namespace EmployerServices.Models
{
    public class ClaimStatusEvent
    {
        [JsonPropertyName("eventType")]
        public string EventType { get; set; } = string.Empty;
        
        [JsonPropertyName("claimReferenceId")]
        public string ClaimReferenceId { get; set; } = string.Empty;
        
        [JsonPropertyName("previousStatus")]
        public string? PreviousStatus { get; set; }
        
        [JsonPropertyName("newStatus")]
        public string NewStatus { get; set; } = string.Empty;
        
        [JsonPropertyName("previousWorkflowStage")]
        public string? PreviousWorkflowStage { get; set; }
        
        [JsonPropertyName("newWorkflowStage")]
        public string? NewWorkflowStage { get; set; }
        
        [JsonPropertyName("updatedBy")]
        public string? UpdatedBy { get; set; }
        
        [JsonPropertyName("sourceSystem")]
        public string? SourceSystem { get; set; }
        
        [JsonPropertyName("timestamp")]
        public DateTime Timestamp { get; set; }
        
        [JsonPropertyName("notes")]
        public string? Notes { get; set; }
    }
}