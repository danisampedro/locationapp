import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Capa = sequelize.define('Capa', {
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
    allowNull: false,
    defaultValue: 'municipio' // municipio, zona_medioambiental, zona_costera, personalizada
  },
  fuente: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  fechaDatos: {
    type: DataTypes.DATE,
    allowNull: true
  },
  normativa: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  },
  tipoPermiso: {
    type: DataTypes.ENUM('permitido', 'autorizacion_necesaria', 'prohibido'),
    allowNull: false,
    defaultValue: 'permitido'
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  },
  geometria: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Geometría en formato GeoJSON'
  },
  activa: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '#3b82f6'
  },
  opacidad: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0.5
  }
}, {
  tableName: 'capas',
  timestamps: true
})

export default Capa

