const { Router } = require('express')

const businessRouter = require('./businesses')
const photosRouter = require('./photos')
const express =require('express')
const router = Router()

router.use('/businesses', businessRouter)
router.use('/photos', photosRouter)
router.use("/media/photos", express.static(`${__dirname}/uploads`))
router.use("/media/thumbs",express.static(`${__dirname}/uploads/thumbs`))

module.exports = router
