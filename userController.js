
import User from "../models/userModels.js"
import AppError from "../uttils/error.uttils.js"
import cloudinary from "cloudinary"
import fs from 'fs/promises'
import crypto from 'crypto'
const cookieOptions={
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: true
}

const register = async (req, res)=>{
   const {fullName, email, password} = req.body
    if(!fullName || !email || !password){
        return next (new AppError('All fields are required', 400))
   }

   const userExists = await User.findOne({email})

   if(userExists){
    return next(new AppError('Email already exists', 400))

   }
  
   const user = await User.create({
        fullName,
        email,
        password,
        avater:{
            public_id: email,
            secure_url: "http://msdn.microsoft.com/en-us/magazine/hh708755.aspx"

        }
   })

   if(!user){
    return next(new AppError('User registrtion faild, please try again latter', 400 ))
   }


//    todo file upload
    console.log('file details', JSON.stringify(req.file));
   if(req.file){

    try {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
             folder: 'lms',
             width: 250,
             height: 250,
             gravity: 'faces',
             crop: 'file'
        })

        if(result){
            user.avater.public_id = result.public_id
            user.avater.secure_url = result.secure_url


            // remove file
            fs.rm(`uploads/${req.file.filename}`)

        }
    } catch (e) {
         return next(
            new AppError(error || 'file not upload. please try again later', 500)
         )
    }

   }

   await user.save()
   user.password = undefined
    
   const token = await user.generateJWTToken()

   res.cookie('token', token, cookieOptions)

   res.status(201).json({
    success: true,
    message: 'User registerd successfully',
    user,

   })
   
}


const login = async (req, res, next)=>{
    try {
        const {email, password} = req.body
    if(!email || !password){
        return next(new AppError('All fields are required', 400))
    }

    const user = await User.findOne({
        email 
    }).select('+password')

    if(!user || !user.comparePassword(password)){
       return next(new AppError('Eamil or password does not macth', 400))
    }

    const token = await user.generateJWTToken()
    user.password = undefined

    res.cookie('token', token, cookieOptions)

    res.status(200).json({
        success: true,
        message: 'user logginin successfully',
        user,
    })

    } catch (e) {
        return next(new AppError(e.message, 500))   
    }
}

const logout = (req, res)=>{
    res.cookie('token', null,{
        secure: true,
        maxAge: 0,
        httpOnly: true
    })

    res.status(200).josn({
        success: true,
        message: 'User logged out successfully'
    })

}


const getProfile = async(req, res)=>{
    try {
        const userId = req.user.id
        const user = await User.findById(userId)

        res.status(200).json({
          success: true,
          message: 'Usre details',
          user
        })
    } catch (error) {
        return next(new AppError("failed ti fetch profile", 200))
        
    }
}

const forgotPassword = async (req, res,next) =>{
    const {email} = req.body

    if(!email){
        return next(new AppError("email is required", 400))
    }
    const user = await User.findOne({email})
    if(!user){
        return next(new AppError("email not registered", 400))
    }
 
    const resetToken = await user.generatePasswordResetToken()

    await user.save()

    const resetPasswordUrl = `${process.env.FRONTED_URL}/reset-password/${resetToken}`
    console.log(resetPasswordUrl)
    const subject = 'Reset Password';
    const messgage = `You can reset your password bt clicking <a href=${resetPasswordUrl} target="_blank">Rset your password<a/>\nIf the above link does not for some resons then copy paste this link new tab ${resetPasswordUrl}.\n if you have not requested this, kindly`
    try{
        await sendEmail(email, subject, message)
         res.status(200).json({
            success: true,
            message: `reset password token has been sent to ${email} successfully `

         })
    } catch(e){
        user.forgotPasswordExpiry = undefined
        user.forgotPasswordToken = undefined
        
        await user.save()
        return next(new AppError(e.message, 400))
    }
}
const resetPassword = async () =>{
    const {resetToken} = req.params;

    const {password} = req.res;
    const forgotPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')
    const user = await User.findOne({
        forgotPasswordToken,
        forgotPasswordExpiry:{ $gt: Date.now()}
    })

    if(!user) {
        return next(
            new AppError('Token is invalid or expired, plaese try again', 400)

        )

    }

    user.password = password
    user.forgotPasswordExpiry = undefined
    user.forgotPasswordToken = undefined

    user.save()

    res.status(200).josn({
        success: true,
        message: 'password changed successfully'
    })
}

const changePassword = async(req, res)=>{
    const {oldPassword, newPassword} = req.body
    const {id} = req.user

    if(!oldPassword || !newPassword){
        return(
            new AppError('All fields are mendatory', 400)

        )
    }

    const user = await User.findById(id).select('+password')
     
    if(!user){
        return next(
            new AppError('User doest exists', 400)
        )
    }
    const isPasswordValid = await user.comparePassword(oldPassword)

    if(!isPasswordValid){
        return next(
            new AppError('invalid old password', 400)
        )
    }
    user.password = newPassword 

    await user.save()

    user.password = undefined;

    res.status(200).json({
        success:true,
        message: 'Password changes succesfully'
        
    })
}
 
const updateUser = async(req, res) => {
    const {fullName} = req.body 
    const {id} = req.user.id
    
    const user = await User.findById(id)

    if(!user){
        return next(
            new AppError('User Does not exists', 400)
        )

    }

    if(req.fullName){
        user.fullName = fullName
    }

    if(req.file){
        await  cloudinary.v2.uploader.destroy(user.avater.public_id)
        
    try {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
             folder: 'lms',
             width: 250,
             height: 250,
             gravity: 'faces',
             crop: 'file'
        })

        if(result){
            user.avater.public_id = result.public_id
            user.avater.secure_url = result.secure_url


            // remove file
            fs.rm(`uploads/${req.file.filename}`)

        }
        } catch (e) {
            return next(
                new AppError(error || 'file not upload. please try again later', 500)
            )
        }
    }

    await user.save()

    res.status({
        success: true,
        message: 'user datails updated successfully'
    })
}


export {
    register,
    login,
    logout,
    getProfile,
    forgotPassword,
    resetPassword,
    changePassword,
    updateUser
}