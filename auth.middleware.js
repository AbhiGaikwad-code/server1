import jwt from "jsonwebtoken";
import AppError from "../uttils/error.uttils.js"

const isLoggedIn = (req, res, next) =>{
    const {token} = req.cookies

    if(!token){
        return next(new AppError('Unauthicated, please login again', 400))
    }
    const userDatails = jwt.verify(token.process.env.JWT_SECRET)

    req.user = userDatails

    next()
}

 const authorizedRoles = (...roles) => async(req, res, next) => {
    const currentUsersRole =req.user.roles;
    if(!roles.includes(currentUsersRole)){
        return next (
            new AppError('YOu dont have permision to access this route', 400)
        )
       

    }
    next()

 }

 const authorizeSubcriber = async(req, res, next) => {
       const subcription = req.user.subcription
       const currentUsersRole = req.user.role

       if(currentUsersRole !== 'ADMIN' && subcription.status !== 'active'){
         return next(
            new AppError('plese subcribe to acess this  routw', 403)
         )

       }
 }

 
export {
    isLoggedIn,
    authorizedRoles,
    authorizeSubcriber
  
}