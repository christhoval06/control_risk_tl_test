FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY TaskManagement.sln ./
COPY api/TaskManagement.Api.csproj api/
RUN dotnet restore api/TaskManagement.Api.csproj

COPY api/ api/
RUN dotnet publish api/TaskManagement.Api.csproj \
    --configuration Release \
    --output /home/site/wwwroot \
    --no-restore

FROM mcr.microsoft.com/azure-functions/dotnet-isolated:4-dotnet-isolated10.0
ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true

COPY --from=build /home/site/wwwroot /home/site/wwwroot
