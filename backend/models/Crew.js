import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Crew = sequelize.define('Crew', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rol: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  }
}, {
  tableName: 'crew',
  timestamps: true
})

export default Crew
