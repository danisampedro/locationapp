import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Evento = sequelize.define('Evento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  titulo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fechaInicio: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  fechaFin: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: null
  },
  color: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '#3b82f6'
  }
}, {
  tableName: 'eventos',
  timestamps: true
})

export default Evento

