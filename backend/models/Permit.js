import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Permit = sequelize.define('Permit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  administracion: {
    type: DataTypes.STRING,
    allowNull: false
  },
  area: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  contacto: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  correo: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  },
  categoria: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  }
}, {
  tableName: 'permits',
  timestamps: true
})

export default Permit







