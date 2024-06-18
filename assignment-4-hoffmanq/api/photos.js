/*
 * API sub-router for businesses collection endpoints.
 */

const { Router } = require('express')

const { validateAgainstSchema } = require('../lib/validation')
const {
    PhotoSchema,
    insertNewPhoto,
    getPhotoById
} = require('../models/photo')

const multer = require('multer')
const crypto = require('node:crypto')
const { getChannel, queueName } = require('../lib/rabbitmq')

const imageTypes={
    "image/jpeg": "jpg",
    "image/png": "png"
}

const upload = multer({
    storage: multer.diskStorage({
        destination: `${__dirname}/uploads`,        
        filename:(req,file,callback) =>{
            const filename = crypto.pseudoRandomBytes(16).toString("hex")
            const extension = imageTypes[file.mimetype]
            callback(null, `${filename}.${extension}`)
        },
        fileFilter: (req,file,callback) => {
            callback(null, !!imageTypes[file.mimetype])
        }
})
})

const router = Router()

/*
 * POST /photos - Route to create a new photo.
 */

router.post('/', upload.single("image"),async (req, res,next) => {
    console.log("req.file: ",req.file)
    console.log("req.body: ",req.body)
    if (req.file && validateAgainstSchema(req.body, PhotoSchema)) {
        try {
            const id = await insertNewPhoto({
                caption: req.body.caption,
                filename: req.file.filename,
                path: req.file.path,
                contentType: req.file.mimetype
            })
            const channel = getChannel()
            channel.sendToQueue(queueName, Buffer.from(id.toString()))
            res.status(201).send({
                id: id
            })
        } catch (err) {
            next(err)
        }
    } else {
        res.status(400).send({
            error: "Request body is not a valid photo object"
        })
    }
})

/*
 * GET /photos/{id} - Route to fetch info about a specific photo.
 */
router.get('/:id', async (req, res, next) => {
    try {
        const photo = await getPhotoById(req.params.id)
        if (photo) {
            photo.photoPath = `/media/photos/${photo.filename}`
            photo.thumbPath = `/media/thumbs/${photo.filename.replace('.png', '.jpg')}`
            delete photo.path
            res.status(200).send(photo)
        } else {
            next()
        }
    } catch (err) {
        next(err)
    }
})

module.exports = router
