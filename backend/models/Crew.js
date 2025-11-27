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
  fotoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  dni: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  fechaNacimiento: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  },
  carnetConducir: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
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
