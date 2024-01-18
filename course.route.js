import {Router}  from 'express'
import { addLectureToCourseById, createCourse, getAllcourses, getLecturesByCourseId, removeCourse, updateCourse } from '../controllers/course.controller.js'
import { authorizeSubcriber, authorizedRoles, isLoggedIn } from '../middlewares/auth.middleware.js'
import uploads from '../middlewares/multer.middleware.js'

const router = Router()

router.route('/')
      .get(getAllcourses)
      .post(
            isLoggedIn,
            authorizedRoles('ADMIN'),
            uploads.single('thumbnail'),
            createCourse
      )
      

router.route('/:id')
      .get(isLoggedIn,authorizeSubcriber, getLecturesByCourseId)
      .put(
            isLoggedIn,
            authorizedRoles('ADMIN'),
            updateCourse
      )
      .delete(
            isLoggedIn,
            authorizedRoles('ADMIN'),
            removeCourse
      )
      .post(
            isLoggedIn,
            authorizedRoles('ADMIN'),
            uploads.single('lecture'),
            addLectureToCourseById
      )

export default router