import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Sheet = sequelize.define('Sheet', {
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
  columnas: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Array de objetos {id, titulo} para las columnas'
  },
  filas: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Array de objetos {id, datos: {columnaId: valor}} para las filas'
  }
}, {
  tableName: 'sheets',
  timestamps: true
})

export default Sheet
