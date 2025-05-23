using Microsoft.EntityFrameworkCore;
using EmployerServices.Models;

namespace EmployerServices.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }
        
        public DbSet<EmployerVerification> EmployerVerifications { get; set; }
        
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<EmployerVerification>(entity =>
            {
                entity.HasIndex(e => e.ClaimReferenceId);
                entity.Property(e => e.Status)
                    .HasConversion<string>()
                    .HasMaxLength(20);
            });
        }
    }
}