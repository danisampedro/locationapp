import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const ContractDocument = sequelize.define('ContractDocument', {
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
  textoEspanol: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  },
  textoIngles: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  }
}, {
  tableName: 'contract_documents',
  timestamps: true
})

export default ContractDocument




