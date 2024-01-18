import Course from '../models/course.model.js '
import AppError from '../uttils/error.uttils.js'
import fs from 'fs/promises'
import cloudinary from 'cloudinary'
const getAllcourses = async function(req, res, next){
    try {
        const courses  =  await Course.find({}).select('-lectures')

        res.status(200).json({
          success: true,
          message: 'all course',
          courses
        })
    } catch (e) {
        return next (
            new AppError(e.message, 500)
        )       
    }   
}
const getLecturesByCourseId = async function(req, res, next) {
      try {
        const {id} = req.params
      
        const course = await Course.findById(id)
     
        if(!course){
            return next(
                new AppError('invalid course id', 400)
            )
        }

        res.status(200).josn({
            success: true,
            message: 'Course Lecturs fetched successfully ', 
            lectures: course.lectures
        });
        
      } catch (e) {
         return next(
            new AppError(e.message, 500)
         )
        
      }
}

const createCourse = async (req, res, next) => {
      const {title, decription, category, cratedBy} = req.body

      if(!title || !decription || !category || !cratedBy){
        return next(
            new AppError('All fields are reqyired', 400)
        )
        
      }

      const course = await Course.create({
        title,
        decription,
        category,
        cratedBy,
        thumnail: {
          public_id: 'dummy',
          secure_url: 'dummy'
        },
      })

      if(!course){
        return next (
            new AppError('could nit created, plaes try agin', 500)

        )

      }

      if(req.file){

        try {
          const result = await cloudinary.v2.uploader.upload(req.file.path, {
            folder: 'lms'
        })
          if(result){
              course.thumnail.public_id = result.public_id
              course.thumnail.secure_url = result.secure_url
          }
           fs.rm(`uploads/${req.file.filename}`)
        } catch (e) {
          return next (
            new AppError(e.message, 500)

        )
          
        }
       
      }
      
      await course.save()

      res.status(200).json({
        success: true,
        message: 'Course created successfully',
        course,
      })

}

const updateCourse = async (req, res, next) => {
  try {
     
    const {id} = req.params
    const course = await Course.findByIdAndUpdate(
      id,
      {
        $set: req.body
      },
      {
        runValidators: true
      }
    )
     
    if(!course){
      return next (
         new AppError('course with given id does not exist', 500)
      )

    }
    res.status(200).json({
        success: true,
        message: 'Coure updated successfully',
        course
    })
    
  }  catch (e) {
        return next (
          new AppError(e.message, 500)

      )
  }
      
}

const removeCourse = async (req, res, next) => {

  try {
    const {id} =  req.params
    const course = await Course.findById(id)

    if(!course){
          return next (
            new AppError('Course with given id does not exists', 500)
        
        )
    }
    await Course.findByIdAndDelete(id)

    res.status(200).json({
        success: true,
        message: 'Course deleted successfully'
    })

  } catch (e) {
        return next (
          new AppError(e.message, 500)

      )
  }
      
}

const addLectureToCourseById =  async(req, res, next) =>{
  try {
    const {title, decription} = req.body
  const {id} = req.params

  
  if(!title || !decription ){
    return next(
        new AppError('All fields are reqyired', 400)
    )
    
  }

  const course = await Course.findById(id)
  
  if(!course){
    return next (
      new AppError('course with given id does not exist', 500)
   )

  }

  const lectureData = {
    title,
    decription,
    lecture: {}
  }

  if(req.file){

    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: 'lms'
    })
      if(result){
        lectureData.lecture.public_id = result.public_id
        lectureData.lecture.secure_url = result.secure_url
      }
       fs.rm(`uploads/${req.file.filename}`)
    } catch (e) {

       return next (
       new AppError(e.message, 500)
    )
      
    }
   
  }
        course.lectures.push(lectureData)
        course.numbersOfLectures = course.lectures.length

        await course.save()

        res.status(200).json({
          success: true,
          message: 'Lecture seecefully added',
          course, 
        })
  } catch (e) {
    return next (
      new AppError(e.message, 500)

  )
    
  }

}

export{
    getAllcourses,
    getLecturesByCourseId,
    createCourse,
    updateCourse,
    removeCourse,
    addLectureToCourseById
}

