const { DataTypes } = require('sequelize')

const sequelize = require('../lib/sequelize')

const Submission = sequelize.define('submission', {
    timestamp: { type: DataTypes.DATE, allowNull: false },
    grade: { type: DataTypes.FLOAT, allowNull: false, defaultValue:0 },
    file: { type: DataTypes.STRING, allowNull: true }
})


exports.Submission = Submission

exports.SubmissionPostFields = [
    'timestamp',
    'assignmentId', 
    'userId'
]

exports.SubmissionUpdateFields = [
    'grade'
]