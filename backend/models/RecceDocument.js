import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const RecceDocument = sequelize.define('RecceDocument', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  proyectoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'proyectos',
      key: 'id'
    }
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  documentTitle: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'LOCATION RECCE'
  },
  recceSchedule: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  meetingPoint: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  meetingPointLink: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  locationManagerName: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  locationManagerPhone: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  locationManagerEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  sunriseTime: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  sunsetTime: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  weatherForecast: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  attendants: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  legs: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  freeEntries: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  }
}, {
  tableName: 'recce_documents',
  timestamps: true
})

export default RecceDocument


