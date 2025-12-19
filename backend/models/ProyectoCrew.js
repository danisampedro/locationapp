import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const ProyectoCrew = sequelize.define('ProyectoCrew', {
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
  crewId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'crew',
      key: 'id'
    }
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  },
  weeklyRate: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  carAllowance: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  boxRental: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  }
}, {
  tableName: 'ProyectoCrew',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['proyectoId', 'crewId']
    }
  ]
})

export default ProyectoCrew










