const { DataTypes } = require('sequelize')

const sequelize = require('../lib/sequelize')
const { Assignment } = require('./assignment')

const Course = sequelize.define('course', {
    subject: { type: DataTypes.STRING, allowNull: false },
    number: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    term: { type: DataTypes.STRING, allowNull: false },
    enrolled: { type: DataTypes.JSON, allowNull: true}
})


Course.hasMany(Assignment, { foreignKey: { allowNull: false } })
Assignment.belongsTo(Course)

exports.Course = Course

exports.CourseClientFields =
[
    'subject', 
    'number', 
    'title', 
    'term',
    'enrolled',
    'userId'
];