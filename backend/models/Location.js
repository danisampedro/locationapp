import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Location = sequelize.define('Location', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  direccion: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  },
  imagenes: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    get() {
      const value = this.getDataValue('imagenes')
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch (e) {
          return []
        }
      }
      return value || []
    }
  }
}, {
  tableName: 'locations',
  timestamps: true
})

export default Location
