import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Vendor = sequelize.define('Vendor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tipo: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  contacto: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
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
  tableName: 'vendors',
  timestamps: true
})

export default Vendor
