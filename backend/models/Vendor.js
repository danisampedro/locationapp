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
  logoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  cif: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  direccion: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
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
  telefonoFijo: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  telefonoMovil: {
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
