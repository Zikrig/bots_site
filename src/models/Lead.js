import { DataTypes } from 'sequelize';
import { sequelize } from '../database.js';

export const LeadStatus = {
  new: 'new',
  contacted: 'contacted',
  closed: 'closed',
};

const Lead = sequelize.define('Lead', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.ENUM(...Object.values(LeadStatus)),
    allowNull: false,
    defaultValue: LeadStatus.new,
  },
}, {
  tableName: 'leads',
  underscored: true,
  timestamps: false,
});

export default Lead;
