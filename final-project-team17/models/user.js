const { DataTypes } = require('sequelize')

const sequelize = require('../lib/sequelize')
const { Submission } = require('./submission')
const { Course } = require('./course')

const bcrypt = require('bcryptjs')

const User = sequelize.define('user', {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        set(value){
            this.setDataValue('password', bcrypt.hashSync(value, 8))
        }
    },
    role: { type: DataTypes.INTEGER, defaultValue: 2}
})


User.hasMany(Course, { foreignKey: { allowNull: false }, onDelete: "CASCADE", onUpdate: "CASCADE"})
Course.belongsTo(User)

User.hasMany(Submission, { foreignKey: { allowNull: false }, onDelete: "CASCADE", onUpdate: "CASCADE"})
Submission.belongsTo(User)

exports.User = User

exports.UserClientFields = [
    'name',
    'email',
    'password',
    'role'
]