
const {Router} = require('express')
const {ValidationError} = require('sequelize')
const {User} = require('../models/user')
const {Course} = require('../models/course')


const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs');
const { requireAuthentication, generateAuthToken } = require('../lib/auth')

const router = Router()

router.post('/',requireAuthentication, async (req, res, next) => {
    try {
        console.log(req.user)
        if (req.body.role !== 0) {
            const requestor = await User.findByPk(req.user.userId)

            if (!requestor) {
                return res.status(400).send({ error: "Requester not found" })
            }
            if (requestor.role == 2) {
                const user = await User.create(req.body)
                return res.status(201).send({ id: user.id })
            } else {
                return res.status(403).send({
                    error: "You do not have permission to create an Instructor or Admin user"
                })
            }
        } else {
            const user = await User.create(req.body)
            return res.status(201).send({ id: user.id })
        }
    } catch (e) {
        if (e instanceof ValidationError) {
            return res.status(400).send({ error: e.message })
        } else {
            next(e)
        }
    }
})

router.post('/login',async(req,res,next)=>{
    try{
        const {email,password} = req.body

        const user = await User.findOne({where: {email:email}})

        if(!user || !(await bcrypt.compare(password,user.password))){
            console.log("comparing passwords")
            return res.status(401).send({error:'Invalid email or password'})
        }
        console.log("password & email correct")
        const token = generateAuthToken(user.id)
        
        return res.status(200).json({token})
    }catch(e){
        if (!req.body.email || !req.body.password) {
            return res.status(400).send({ error: e.message })
        } else if(e instanceof ValidationError) {
            return res.status(400).send({ error: e.message })
        } else
        {
            next(e)
        }
    }
})

router.get('/:id',requireAuthentication,async(req,res,next)=>{
    try{
        console.log(req.user)
        const requestor = await User.findByPk(req.user.userId)
        if(!requestor){
            return res.status(400).send({ error: "Requester not found" })
        }

        if(req.user.userId != req.params.id)
        {
            return res.status(403).send({ erorr: "You are not authorized to view this resource"})
        }

        if(requestor.role == 1)
        {
            const user = await User.findAll({
                where:{id: req.params.id},
                attributes: { exclude: ['password']},
                include:{
                    model:Course,
                    required: false,
                    attributes: { exclude: ['subject', 'number', 'title', 'term', 'enrolled', 'createdAt', 'updatedAt', 'userId'] }
                }
            })

                
            return res.status(200).send({
                user: user
            })
        }else if(requestor.role == 0)
        {
            const user = await User.findAll({
                where:{id: req.params.id},
                attributes: { exclude: ['password', 'createdAt', 'updatedAt']}
            })

            const course = await Course.findAndCountAll({ attributes: { exclude: ['createdAt', 'updatedAt'] }})

            let courseList = []

            console.log(course.rows[0].enrolled.students.indexOf(parseInt(req.params.id)))

            for(let i = 0; i < course.rows.length; i++)
            {
                let index = course.rows[i].enrolled.students.indexOf(parseInt(req.params.id))
                if(index != -1)
                {
                    courseList.push(course.rows[i].id)
                }
            }
            
            return res.status(200).send({
                user: user,
                courseList: courseList
            })
        }else
        {
            const user = await User.findAll({
                where:{id: req.params.id},
                attributes: { exclude: ['password']}
            })

            
            return res.status(200).send({
                user: user
            })
        }

    }catch(e){
        console.log(e)
        return res.status(500).send({error:'Internal Server Error'})
    }
})
module.exports = router
