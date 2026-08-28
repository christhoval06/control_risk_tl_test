@description('Deployment environment name.')
@allowed([
  'dev'
  'staging'
  'prod'
])
param environmentName string = 'dev'

@description('Azure region for all resources.')
param location string = resourceGroup().location

@minLength(1)
@maxLength(12)
@description('Short application name used in resource names. Use lowercase letters and numbers for best Azure naming compatibility.')
param appName string = 'taskmgmt'

@description('Allowed browser origins for the Function App CORS policy.')
param allowedOrigins array = [
  'http://localhost:5173'
]

@description('API Management publisher email.')
param apimPublisherEmail string = 'api-owner@example.com'

@description('API Management publisher name.')
param apimPublisherName string = 'Task Management'

@description('Microsoft Entra ID authority used by JWT validation.')
param jwtAuthority string

@description('JWT audience expected by the API.')
param jwtAudience string

@description('SQL administrator login.')
param sqlAdministratorLogin string

@secure()
@description('SQL administrator password. Provide from GitHub Actions secret, never commit it.')
param sqlAdministratorPassword string

@description('Azure Functions hosting plan SKU. Use FC1 for serverless Flex Consumption, or a dedicated SKU such as B1 if quota allows it.')
param functionPlanSku string = environmentName == 'prod' ? 'EP1' : 'FC1'

@description('Azure Functions hosting plan tier. Match the selected SKU, such as FlexConsumption for FC1, ElasticPremium for EP1, Basic for B1, or Dynamic for Y1.')
param functionPlanTier string = environmentName == 'prod' ? 'ElasticPremium' : 'FlexConsumption'

var suffix = uniqueString(resourceGroup().id, appName, environmentName)
var normalizedAppName = toLower('${appName}-${environmentName}-${suffix}')
var storageAccountPrefix = take(replace(toLower('st${appName}${environmentName}'), '-', ''), 11)
var storageAccountName = '${storageAccountPrefix}${suffix}'
var appInsightsName = 'appi-${normalizedAppName}'
var logAnalyticsName = 'log-${normalizedAppName}'
var planName = 'asp-${normalizedAppName}'
var functionAppName = 'func-${normalizedAppName}'
var apiManagementName = 'apim-${normalizedAppName}'
var apiManagementGatewayUrl = 'https://${apiManagementName}.azure-api.net'
var apiManagementApiPath = 'api'
var apiManagementApiName = 'task-management-api'
var apiManagementAllowedOriginsPolicy = join(map(allowedOrigins, origin => '<origin>${origin}</origin>'), '')
var sqlServerName = 'sql-${normalizedAppName}'
var sqlDatabaseName = 'TaskManagement'

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

resource workspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: environmentName == 'prod' ? 90 : 30
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: workspace.id
  }
}

resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: planName
  location: location
  kind: functionPlanSku == 'FC1' ? 'functionapp' : 'linux'
  sku: {
    name: functionPlanSku
    tier: functionPlanTier
  }
  properties: {
    reserved: true
  }
}

resource sqlServer 'Microsoft.Sql/servers@2023-08-01' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: sqlAdministratorLogin
    administratorLoginPassword: sqlAdministratorPassword
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }
}

resource sqlAllowAzureServices 'Microsoft.Sql/servers/firewallRules@2023-08-01' = {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-08-01' = {
  parent: sqlServer
  name: sqlDatabaseName
  location: location
  sku: {
    name: environmentName == 'prod' ? 'S1' : 'Basic'
    tier: environmentName == 'prod' ? 'Standard' : 'Basic'
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: environmentName == 'prod' ? 268435456000 : 2147483648
  }
}

resource functionApp 'Microsoft.Web/sites@2023-12-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOTNET-ISOLATED|10.0'
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      alwaysOn: contains([
        'Y1'
        'FC1'
      ], functionPlanSku) ? false : true
      cors: {
        allowedOrigins: allowedOrigins
        supportCredentials: false
      }
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storage.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storage.listKeys().keys[0].value}'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'dotnet-isolated'
        }
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'SqlConnectionString'
          value: 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Initial Catalog=${sqlDatabase.name};Persist Security Info=False;User ID=${sqlAdministratorLogin};Password=${sqlAdministratorPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
        }
        {
          name: 'Jwt__Authority'
          value: jwtAuthority
        }
        {
          name: 'Jwt__Audience'
          value: jwtAudience
        }
        {
          name: 'Cors__AllowedOrigins'
          value: join(allowedOrigins, ',')
        }
      ]
    }
  }
}

resource apiManagement 'Microsoft.ApiManagement/service@2023-09-01-preview' = {
  name: apiManagementName
  location: location
  sku: {
    name: 'Consumption'
    capacity: 0
  }
  properties: {
    publisherEmail: apimPublisherEmail
    publisherName: apimPublisherName
    publicNetworkAccess: 'Enabled'
    virtualNetworkType: 'None'
    customProperties: {
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Backend.Protocols.Ssl30': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Backend.Protocols.Tls10': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Backend.Protocols.Tls11': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Tls10': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Tls11': 'false'
    }
  }
}

resource taskApi 'Microsoft.ApiManagement/service/apis@2023-09-01-preview' = {
  parent: apiManagement
  name: '${apiManagementApiName};rev=1'
  properties: {
    displayName: 'Task Management API'
    description: 'Gateway facade for the Task Management Azure Functions API.'
    path: apiManagementApiPath
    protocols: [
      'https'
    ]
    serviceUrl: 'https://${functionApp.properties.defaultHostName}/api'
    subscriptionRequired: false
    type: 'http'
    format: 'openapi+json'
    value: loadTextContent('../docs/swagger.json')
  }
}

resource taskApiPolicy 'Microsoft.ApiManagement/service/apis/policies@2023-09-01-preview' = {
  parent: taskApi
  name: 'policy'
  properties: {
    format: 'rawxml'
    value: '<policies><inbound><cors allow-credentials="false"><allowed-origins>${apiManagementAllowedOriginsPolicy}</allowed-origins><allowed-methods><method>*</method></allowed-methods><allowed-headers><header>*</header></allowed-headers><expose-headers><header>*</header></expose-headers></cors><base /></inbound><backend><base /></backend><outbound><base /></outbound><on-error><base /></on-error></policies>'
  }
}

output functionAppName string = functionApp.name
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'
output apiManagementName string = apiManagement.name
output apiManagementGatewayUrl string = apiManagementGatewayUrl
output apiManagementApiUrl string = '${apiManagementGatewayUrl}/${apiManagementApiPath}'
output sqlServerName string = sqlServer.name
output sqlServerFullyQualifiedDomainName string = sqlServer.properties.fullyQualifiedDomainName
output sqlDatabaseName string = sqlDatabase.name
