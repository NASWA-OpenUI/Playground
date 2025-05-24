FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5002

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
ENTRYPOINT ["dotnet", "EmployerServices.dll"]