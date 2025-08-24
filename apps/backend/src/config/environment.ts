interface Config {
  port: number
  nodeEnv: string
  isDevelopment: boolean
  isProduction: boolean
  mongoUri: string
  jwtSecret: string
  jwtExpiresIn: string | number
  googleAiApiKey?: string
  openaiApiKey?: string
}

function validateEnvironment(): Config {
  const nodeEnv = process.env.NODE_ENV || 'development'
  const isDevelopment = nodeEnv === 'development'
  const isProduction = nodeEnv === 'production'

  // Port configuration
  const port = parseInt(process.env.PORT || '3000', 10)
  if (isNaN(port) || port <= 0) {
    throw new Error('PORT must be a positive integer')
  }

  // MongoDB URI configuration
  const mongoUri = isDevelopment
    ? process.env.MONGODB_URI_DEV
    : process.env.MONGODB_URI_PROD

  // Allow tests to run without database configuration
  const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'
  
  if (!mongoUri && !isTestEnvironment) {
    const requiredVar = isDevelopment ? 'MONGODB_URI_DEV' : 'MONGODB_URI_PROD'
    throw new Error(`${requiredVar} environment variable is required`)
  }

  // JWT configuration
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret && isProduction) {
    throw new Error('JWT_SECRET environment variable is required in production')
  }

  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h'

  return {
    port,
    nodeEnv,
    isDevelopment,
    isProduction,
    mongoUri: mongoUri || 'mongodb://localhost:27017/test',
    jwtSecret: jwtSecret || 'development-secret-key-change-in-production',
    jwtExpiresIn,
    googleAiApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY
  }
}

let _config: Config | null = null

export function getConfig(): Config {
  if (!_config) {
    _config = validateEnvironment()
  }
  return _config
}

// For backwards compatibility and ease of use
export const config = getConfig()