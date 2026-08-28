@description('Deployment environment name.')
@allowed([
  'dev'
  'staging'
  'prod'
])
param environmentName string = 'dev'

@description('Azure region for SQL resources.')
param location string = resourceGroup().location

@minLength(1)
@maxLength(12)
@description('Short application name used in resource names. Use lowercase letters and numbers for best Azure naming compatibility.')
param appName string = 'taskmgmt'

@description('SQL administrator login.')
param sqlAdministratorLogin string

@secure()
@description('SQL administrator password. Never commit it.')
param sqlAdministratorPassword string

var suffix = uniqueString(resourceGroup().id, appName, environmentName)
var normalizedAppName = toLower('${appName}-${environmentName}-${suffix}')
var sqlServerName = 'sql-${normalizedAppName}'
var sqlDatabaseName = 'TaskManagement'

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

output sqlServerName string = sqlServer.name
output sqlServerFullyQualifiedDomainName string = sqlServer.properties.fullyQualifiedDomainName
output sqlDatabaseName string = sqlDatabase.name
