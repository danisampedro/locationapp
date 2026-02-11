import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Timesheet = sequelize.define('Timesheet', {
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
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  weekNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  weekStartDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: null
  },
  projectTitle: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  projectCompany: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  workerName: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  workerRole: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  days: {
    // Array de días con horas, modelo, extras, etc.
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  totalHoras: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  totalHorasExtra: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'timesheets',
  timestamps: true
})

export default Timesheet

