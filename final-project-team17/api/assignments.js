const multer = require("multer")
const crypto = require("node:crypto")
const { ValidationError } = require('sequelize')

const { Assignment, AssignmentClientFields } = require('../models/assignment')
const { Submission, SubmissionUpdateFields, SubmissionPostFields } = require('../models/submission')
const { User } = require('../models/user')
const { Course, CourseClientFields } = require('../models/course')

const { generateAuthToken, requireAuthentication } = require('../lib/auth')

const { Router } = require('express')

const router = Router()

const imageTypes = {
    "image/jpeg": "jpg",
    "image/png": "png"
}

const upload = multer({
    storage: multer.diskStorage({
        destination: `${__dirname}/uploads`,
        filename: (req, file, callback) => {
            const filename = crypto.pseudoRandomBytes(16).toString("hex")
            const extension = imageTypes[file.mimetype]
            callback(null, `${filename}.${extension}`)
        },
    }),
    fileFilter: (req, file, callback) => {
        callback(null, !!imageTypes[file.mimetype])
    }
})

router.post('/', requireAuthentication, async (req, res, next) => {

    const courseId = req.body.courseId

    //determine the instructor of the course they're attempting to assign to
    if (courseId) {
        const courseInQuestion = await Course.findByPk(courseId)

        //get info about the user making the assignment
        const requester = await User.findByPk(req.user.userId)

        //make sure they both exist before doing any testing
        if (requester && courseInQuestion) {
            //make sure the logged in user matches the owner of the courseid supplied, if not, still let them if they're an admin
            if ((req.user.userId != courseInQuestion.userId) && (requester.role != 2)) {
                res.status(403).send({
                    error: "Not authorized to access the specified resource fella"
                })
            }
            else {
                try {
                    const assignment = await Assignment.create(req.body, AssignmentClientFields)
                    res.status(201).send({ id: assignment.id })
                } catch (e) {
                    if (e instanceof ValidationError) {
                        res.status(400).send({ error: e.message })
                    } else {
                        next(e)
                    }
                }
            }
        }
        else {
            res.status(404).send({
                err: "Must provide valid user credentials AND valid course"
            })
        }

    }
    else {
        res.status(400).send({
            err: "courseId must be supplied"
        })
    }


})

router.get('/:id', async (req, res, next) => {
    try {
        const assignment = await Assignment.findByPk(req.params.id, { attributes: { exclude: ['createdAt', 'updatedAt', 'enrolled'] } } )
        if (assignment) {
            res.status(200).send(assignment)
        } else {
            next()
        }
    } catch (err) {
        next(err)
    }
})

router.patch('/:id', requireAuthentication, async (req, res, next) => {
    const assignment = await Assignment.findByPk(req.params.id)

    const requester = await User.findByPk(req.user.userId)

    const course = await Course.findByPk(assignment.courseId)

    if(requester)
    {
        if(assignment && (requester.id == course.userId || requester.role == 2))
        {
            const result = Assignment.update(
                req.body,
                { where: { id: req.params.id } }
            )
            res.status(204).send()
        }else
        {
            res.status(403).send({
                error: "Not authorized to access the specified resource fella"
            })
        }
    }else
    {
        res.status(404).send({
            error: "The specified assignment id was not found"
        })
    }
})

router.delete('/:id', requireAuthentication, async (req, res, next) => {
    const assignment = await Assignment.findByPk(req.params.id)

    const requester = await User.findByPk(req.user.userId)

    const course = await Course.findByPk(assignment.courseId)

    if(requester)
    {
        if(assignment && (requester.id == course.userId || requester.role == 2))
        {
            const result = Assignment.destroy(
                {
                    where: { id: req.params.id }
                }
            )
            res.status(204).send()
        }else
        {
            res.status(403).send({
                error: "Not authorized to access the specified resource fella"
            })
        }
    }else
    {
        res.status(404).send({
            error: "The specified assignment id was not found"
        })
    }
})

/*
    Add a submission to an assignment
*/
router.post('/:id/submissions', requireAuthentication, upload.single("submission"), async (req, res, next) => {

    console.log(req.params.id)
    //verify that the assignment they're submitting to exists
    const assignmentInQuestion = await Assignment.findByPk(req.params.id)

    const userId = req.body.userId

    //determine who wants to post
    const requester = await User.findByPk(req.user.userId)

    if (assignmentInQuestion) {
        //make sure the logged in user matches the userid supplied, if not, still let them if they're an admin
        if ((req.user.userId != userId) && (requester.role != 2)) {
            res.status(403).send({
                error: "Not authorized to access the specified resource fella"
            })
        }
        else {
            try {
                let fileCreate = {
                    file: req.file.filename,
                    ...req.body
                }
                const submission = await Submission.create(fileCreate, SubmissionPostFields)
                res.status(201).send({ id: submission.id })
            } catch (e) {
                if (e instanceof ValidationError) {
                    res.status(400).send({ error: e.message })
                } else {
                    next(e)
                }
            }
        }
    }
    else {
        res.status(404).send({
            err: "Provided Assignment ID does not exist"
        })
    }

})

/*
    Get submission list or for specific student still listed format
*/
router.get('/:id/submissions', requireAuthentication, async (req, res, next) => {

    //verify that the assignment they're submitting to exists
    const assignment = await Assignment.findByPk(req.params.id)

    //determine who wants to post
    const requester = await User.findByPk(req.user.userId)

    if (assignment) {

        const course = await Course.findByPk(assignment.courseId)

        //make sure the logged in user matches the userid supplied, if not, still let them if they're an admin
        if ((req.user.userId != course.userId) && (requester.role != 2)) {
            res.status(403).send({
                error: "Not authorized to access the specified resource fella"
            })
        }
        else {
            try {

                let page = parseInt(req.query.page) || 1
                page = page < 1 ? 1 : page
                const pageSize = 10
                const offset = (page - 1) * pageSize
                if (req.query.studentId) 
                {
                    const submission = await Submission.findAndCountAll(
                        {
                            limit: pageSize,
                            offset: offset,
                            where: { assignmentId: req.params.id,  userId: req.query.studentId},
                            attributes: { exclude: ['createdAt', 'updatedAt'] }
                        }
                    )

                    let totalPages = Math.floor(submission.count / pageSize)
                    totalPages = totalPages <= 0 ? 1 : totalPages

                    //console.log(submission.rows)
                    let sendData = []

                    //loop through the submissions and add the media links
                    for(let i = 0; i < submission.rows.length; i++){
                            
                        const pullData = {
                            id : submission.rows[i].id,
                            timestamp : submission.rows[i].timestamp,
                            grade : submission.rows[i].grade,
                            file : submission.rows[i].file,
                            assignmentId : submission.rows[i].assignmentId,
                            userId : submission.rows[i].userId,
                            url : `/media/submissions/${submission.rows[i].file}`
                        }

                        sendData.push(pullData)
                    
                    }

                    res.status(200).send(
                        {
                            submissions: sendData,
                            count: submission.count,
                            totalPages: totalPages
                        }
                    )
                }else
                {
                    const submission = await Submission.findAndCountAll(
                        {
                            limit: pageSize,
                            offset: offset,
                            where: { assignmentId: req.params.id },
                            attributes: { exclude: ['createdAt', 'updatedAt'] }
                        }
                    )

                    let totalPages = Math.floor(submission.count / pageSize)
                    totalPages = totalPages <= 0 ? 1 : totalPages

                    //console.log(submission.rows)
                    let sendData = []

                    //loop through the submissions and add the media links
                    for(let i = 0; i < submission.rows.length; i++){
                            
                        const pullData = {
                            id : submission.rows[i].id,
                            timestamp : submission.rows[i].timestamp,
                            grade : submission.rows[i].grade,
                            file : submission.rows[i].file,
                            assignmentId : submission.rows[i].assignmentId,
                            userId : submission.rows[i].userId,
                            url : `/media/submissions/${submission.rows[i].file}`
                        }

                        sendData.push(pullData)
                    
                    }

                    res.status(200).send(
                        {
                            submissions: sendData,
                            count: submission.count,
                            totalPages: totalPages
                        }
                    )
                }

            } catch (e) {
                if (e instanceof ValidationError) {
                    res.status(400).send({ error: e.message })
                } else {
                    next(e)
                }
            }
        }
    }
    else {
        res.status(404).send({
            err: "Provided Assignment ID does not exist"
        })
    }

})

module.exports = router



