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

FROM mcr.microsoft.com/dotnet/sdk:10.0
ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true \
    FUNCTIONS_CORE_TOOLS_TELEMETRY_OPTOUT=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates gnupg \
    && . /etc/os-release \
    && curl -fsSL "https://packages.microsoft.com/config/ubuntu/${VERSION_ID}/packages-microsoft-prod.deb" -o packages-microsoft-prod.deb \
    && dpkg -i packages-microsoft-prod.deb \
    && rm packages-microsoft-prod.deb \
    && apt-get update \
    && apt-get install -y --no-install-recommends azure-functions-core-tools-4 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /home/site/wwwroot /home/site/wwwroot

WORKDIR /home/site/wwwroot
EXPOSE 80

CMD ["func", "start", "--port", "80", "--cors", "http://localhost:5173"]
