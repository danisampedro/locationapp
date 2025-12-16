import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Map = sequelize.define('Map', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  imagenUrl: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  imageWidth: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  imageHeight: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  scale: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: false,
    defaultValue: 0
  },
  workArea: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Área de trabajo: {x, y, width, height} en píxeles'
  },
  objects: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array de objetos en el mapa'
  },
  objectLibrary: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Biblioteca de objetos personalizados'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'maps',
  timestamps: true
})

export default Map
