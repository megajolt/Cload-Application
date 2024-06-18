const { SELECT } = require('sequelize/lib/query-types')
const { requireAuthentication } = require('../lib/auth')
const { ValidationError } = require('sequelize')
const { Course, CourseClientFields } = require('../models/course')
const { User } = require('../models/user')

const { Router, json } = require('express')
const { Assignment } = require('../models/assignment')
const { Submission } = require('../models/submission')
const csvjson = require('csvjson')

const router = Router()

/*
    POST endpoint for courses
    Requires admin level privleges to work otherwise it fails.
*/
router.post('/', requireAuthentication, async (req, res, next) => {

    // determine who wants to post
    const requester = await User.findByPk(req.user.userId)

    if (req.body.instructorId) {
        const swapID = req.body.instructorId

        delete req.body.instructorId

        let newBodyObject = {}

        if (req.body.enrolled == null) {
            newBodyObject = {
                userId: swapID,
                enrolled: { "students": [] },
                ...req.body
            }
        } else {
            newBodyObject = {
                userId: swapID,
                ...req.body
            }
        }


        if (requester) {
            if (requester.role == 2) {
                try {
                    const course = await Course.create(newBodyObject, CourseClientFields)
                    res.status(201).send({ id: course.id })
                } catch (e) {
                    if (e instanceof ValidationError) {
                        res.status(400).send({ error: e.message })
                    } else {
                        next(e)
                    }
                }
            } else {
                res.status(403).send({
                    error: "Not authorized to access the specified resource fella"
                })
            }
        } else {
            res.status(404).send({
                err: "Please login to a user"
            })
        }
    } else {
        res.status(400).send(
            {
                error: "Instuctor Id required"
            }
        )
    }
})

/*
    Get list of courses (pagination)
*/
router.get('/', async (req, res, next) => {

    let page = parseInt(req.query.page) || 1
    page = page < 1 ? 1 : page
    const pageSize = 10
    const offset = (page - 1) * pageSize

    const result = await Course.findAndCountAll(
        {
            limit: pageSize,
            offset: offset,
            attributes: { exclude: ['createdAt', 'updatedAt'] }
        }
    )

    let totalPages = Math.floor(result.count / pageSize)
    totalPages = totalPages <= 0 ? 1 : totalPages

    res.status(200).send(
        {
            courses: result.rows,
            count: result.count,
            totalPages: totalPages
        }
    )
})

/*
    Get course by id
*/
router.get('/:id', async (req, res, next) => {

    let courseId = req.params.id

    const course = await Course.findByPk(courseId, { attributes: { exclude: ['createdAt', 'updatedAt', 'enrolled'] } })

    if (course) {
        res.status(200).send(course)
    } else {
        res.status(400).send(
            {
                error: "Pleas enter a valid course id"
            }
        )
    }

})

/*
    patch a course 
    Required: instuctor or admin
*/
router.patch('/:id', requireAuthentication, async (req, res, next) => {

    const requester = await User.findByPk(req.user.userId)

    const courseId = req.params.id

    const course = await Course.findByPk(courseId, { attributes: { exclude: ['createdAt', 'updatedAt'] } })


    if (requester) {
        if (course && (requester.id == course.userId || requester.role == 2)) {
            const result = Course.update(
                req.body,
                { where: { id: courseId } }
            )
            res.status(204).send()
        } else {
            res.status(400).send(
                {
                    error: "Not authorized to view this resource"
                }
            )

        }

    } else {
        res.status(404).send({
            error: "Please login to a user"
        })
    }

})

/*
    Deletes the given course
    Required: Admin
*/
router.delete('/:id', requireAuthentication, async (req, res, next) => {

    const requester = await User.findByPk(req.user.userId)

    const courseId = req.params.id

    const course = await Course.findByPk(courseId, { attributes: { exclude: ['createdAt', 'updatedAt'] } })

    if (course) {
        if (requester) {
            if (requester.role == 2) {
                const result = Course.destroy(
                    {
                        where: { id: courseId }
                    }
                )
                res.status(204).send()
            } else {
                res.status(403).send(
                    {
                        error: "Not authorized to view this resource"
                    }
                )

            }

        } else {
            res.status(404).send({
                error: "Please login to a user"
            })
        }
    } else {
        res.status(404).send(
            {
                error: "Specified course doesn't exist"
            }
        )
    }


})

/*
    Returns the list of students enrolled in a course
    Required: Instructor or Admin
*/
router.get('/:id/students', requireAuthentication, async (req, res, next) => {

    let courseId = req.params.id

    const requester = await User.findByPk(req.user.userId)

    const course = await Course.findByPk(courseId)

    if (requester) {
        if ((req.user.userId == course.userId) || (requester.role == 2)) {
            res.status(200).send(course.enrolled)
        } else {
            res.status(403).send(
                {
                    error: "Not authorized to view this resource"
                }
            )
        }
    } else {
        res.status(404).send({
            error: "Please login to a user"
        })
    }
})

/*
    Enroll Students
*/
router.post('/:id/students', requireAuthentication, async (req, res, next) => {
    let courseId = req.params.id

    const requester = await User.findByPk(req.user.userId)

    const course = await Course.findByPk(courseId)

    if (requester) {
        console.log(requester)
        if ((requester.id == course.userId) || requester.role == 2) {
            let jsonArray = course.enrolled.students
            if (req.body.add && req.body.remove) {
                for (let i = 0; i < req.body.add.length; i++) {

                    if (!jsonArray.includes(req.body.add[i])) {
                        jsonArray.push(parseInt(req.body.add[i]))
                    }

                }

                for (let i = 0; i < req.body.remove.length; i++) {
                    let index = jsonArray.indexOf(parseInt(req.body.remove[i]))

                    if (index != -1) {
                        let x = jsonArray.splice(index, 1)
                        console.log(jsonArray)
                    }

                }

                const result = Course.update(
                    { enrolled: { "students": jsonArray } },
                    { where: { id: courseId } }
                )

                res.status(200).send()
            }

        } else {
            res.status(403).send(
                {
                    error: "Not authorized to view this resource"
                }
            )
        }
    } else {
        res.status(404).send({
            error: "Please login to a user"
        })
    }
})
/*
    Returns a csv file of the students in the specified course.
    Requires: Insructor of course or Admin

    Sources used: 
    https://www.geeksforgeeks.org/how-to-convert-json-object-to-csv-in-javascript/
    https://stackoverflow.com/questions/63199136/sending-csv-back-with-express (How to specify the type for CSV response)
*/
router.get('/:id/roster', requireAuthentication, async (req, res, next) => {

    let courseId = req.params.id

    const requester = await User.findByPk(req.user.userId)

    const course = await Course.findByPk(courseId)

    if (requester) {
        if(course)
        {
            if ((req.user.userId == course.userId) || (requester.role == 2)) {

                let jsonArray = []

                for (let i = 0; i < course.enrolled.students.length; i++) {
                    let user = await User.findByPk(course.enrolled.students[i])

                    if (user) {
                        let jsonObject = {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                        }

                        jsonArray.push(jsonObject)
                    }
                }
                const csvData = csvjson.toCSV(jsonArray, { headers: 'key' })

                res.type('text/csv').status(200).send(csvData)
            } else {
                res.status(403).send(
                    {
                        error: "Not authorized to view this resource"
                    }
                )
            }
        }else
        {
            res.status(404).send(
                {
                    error: "Specified course id does not exist"
                }
            )
        }
        
    } else {
        res.status(404).send({
            error: "Please login to a user"
        })
    }
})

/*
    Get assignments for given course
*/
router.get('/:id/assignments', requireAuthentication, async (req, res, next) => {

    let courseId = req.params.id

    const requester = await User.findByPk(req.user.userId)

    const course = await Course.findByPk(courseId)

    if (requester) {
        if ((req.user.userId == course.userId) || (requester.role == 2)) 
        {
            const assignments = await Assignment.findAndCountAll({ where: { courseId: courseId }, attributes: { exclude: ['createdAt', 'updatedAt'] }})

            res.status(200).send(assignments.rows)
        } else {
            res.status(403).send(
                {
                    error: "Not authorized to view this resource"
                }
            )
        }
    } else {
        res.status(404).send({
            error: "Please login to a user"
        })
    }
})

module.exports = router