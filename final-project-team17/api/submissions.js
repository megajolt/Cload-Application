const { requireAuthentication } = require('../lib/auth')
const {Submission} = require('../models/submission')
const {User} = require('../models/user')

const { Router } = require('express')

const router = Router()


//get information about a specific submission (including links to the media)
router.get('/:id', async (req, res, next) => {
    try {
        const submission = await Submission.findByPk(req.params.id, { attributes: { exclude: ['createdAt', 'updatedAt'] }})
        if (submission) {
            submission.url = `/media/submissions/${submission.file}`
            res.status(200).send(submission)
        } else {
            next()
        }
    } catch (err) {
        next(err)
    }
})

router.patch('/:id',requireAuthentication, async (req,res,next) =>{
    try{
        const requester = await User.findByPk(req.user.userId)
        const submission = await Submission.findByPk(req.params.id)
        if(!requester){
            return res.status(400).send({error:"Requester not found"})
        }
        if(requester.role==0){
           return res.status(403).send({error:"Not authorized to make grade changes"})
        }
        if(!submission){
            return res.status(400).send({error:"Submission not found"})
        }
        if(!req.body.grade){
            return res.status(400).send({error:"Grade is required"})
        }
        const result = Submission.update(
            {grade:req.body.grade},
            {where:{id:req.params.id}}
        )
        if (result) {
            return res.status(204).send({msg: "Updated"})
          } else {
            return res.status(500).send({ error: "Failed to update submission" })
          }
    }
    catch(err){
        next(err)
    }
})

module.exports = router