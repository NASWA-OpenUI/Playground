FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5002

# Build React app first
FROM node:18 AS react-build
WORKDIR /src
COPY ["ClientApp/package.json", "ClientApp/package-lock.json*", "ClientApp/"]
WORKDIR /src/ClientApp
RUN npm ci --only=production
COPY ClientApp/ .
RUN npm run build

# Build .NET app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["EmployerServices.csproj", "."]
RUN dotnet restore "EmployerServices.csproj"
COPY . .
WORKDIR "/src"
RUN dotnet build "EmployerServices.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "EmployerServices.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
# Copy the built React app to wwwroot
COPY --from=react-build /src/ClientApp/build ./wwwroot
ENTRYPOINT ["dotnet", "EmployerServices.dll"]