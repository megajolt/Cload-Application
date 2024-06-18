require("dotenv").config()
const sequelize = require('./lib/sequelize')
const { Submission, SubmissionPostFields } = require('./models/submission')
const { Course, CourseClientFields } = require('./models/course')
const { Assignment, AssignmentClientFields } = require('./models/assignment')
const { User, UserClientFields } = require('./models/user')

const submissionData = require('./data/submissions.json')
const courseData = require('./data/courses.json')
const assignmentData = require('./data/assignments.json')
const userData = require('./data/users.json')

sequelize.sync({ force: true }).then(async function () {
  try {
    // Bulk insert user data
    await User.bulkCreate(userData, { fields: UserClientFields })

    // Bulk insert course data
    await Course.bulkCreate(courseData, { fields: CourseClientFields })

    // Bulk insert assignment data
    await Assignment.bulkCreate(assignmentData, { fields: AssignmentClientFields })

    // Bulk insert submission data
    await Submission.bulkCreate(submissionData, { fields: SubmissionPostFields })

    console.log('Database initialization complete')
  } catch (error) {
    console.error('Error initializing database:', error)
  }
})
