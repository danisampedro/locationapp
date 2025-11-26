import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'

dotenv.config()

let sequelize

// Si DATABASE_URL está disponible, úsala directamente
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  })
} else {
  // Si no, usa las variables individuales
  sequelize = new Sequelize(
    process.env.DB_NAME || 'locationapp',
    process.env.DB_USER || '',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  )
}

export default sequelize

