# Use official .NET 8 SDK image for building the application
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files and restore dependencies
COPY ["HotelManagement.Api/HotelManagement.Api.csproj", "HotelManagement.Api/"]
COPY ["HotelManagement.Application/HotelManagement.Application.csproj", "HotelManagement.Application/"]
COPY ["HotelManagement.Domain/HotelManagement.Domain.csproj", "HotelManagement.Domain/"]
COPY ["HotelManagement.Infrastructure/HotelManagement.Infrastructure.csproj", "HotelManagement.Infrastructure/"]

RUN dotnet restore "HotelManagement.Api/HotelManagement.Api.csproj"

# Copy all source files and publish
COPY . .
WORKDIR "/src/HotelManagement.Api"
RUN dotnet publish "HotelManagement.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Production runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "HotelManagement.Api.dll"]
