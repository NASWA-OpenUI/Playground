# benefits-administration/Dockerfile
FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["BenefitsAdmin.csproj", "./"]
RUN dotnet restore "./BenefitsAdmin.csproj"

# Copy the rest of the files and build
COPY . .
RUN dotnet build "BenefitsAdmin.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "BenefitsAdmin.csproj" -c Release -o /app/publish

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:6.0
WORKDIR /app
COPY --from=publish /app/publish .

# Add a healthcheck endpoint
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

EXPOSE 80
EXPOSE 443

ENTRYPOINT ["dotnet", "BenefitsAdmin.dll"]
