const { DataTypes } = require('sequelize')

const sequelize = require('../lib/sequelize')
var bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);

const User = sequelize.define('user',{
    name: { type: DataTypes.STRING, allowNull: false },
    email:{ type: DataTypes.STRING, allowNull: false,unique:true},
    password:{ type: DataTypes.STRING, allowNull: false ,set(value){
        this.setDataValue('password', bcrypt.hashSync(value, salt));
    }},
    admin:{type: DataTypes.BOOLEAN,allowNull:true,defaultValue:0}
})

exports.User = User

exports.UserFields = [
    'name',
    'email',
    'password',
    'admin'
  ]