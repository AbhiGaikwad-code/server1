import {Router} from 'express'
import { getProfile, register, login, logout, resetPassword, forgotPassword, changePassword, updateUser } from '../controllers/userController.js'
import { isLoggedIn } from '../middlewares/auth.middleware.js'
import uploads from '../middlewares/multer.middleware.js'

const router = Router()

router.post('/register',uploads.single("avatar"), register)
router.post('/login', login)
router.get('/logout', logout)
router.get('/me',isLoggedIn, getProfile)
router.post('/reset', forgotPassword)
router.post('/reset/:resetToken', resetPassword)
router.post('/change-password', isLoggedIn, changePassword)
router.put('/update', isLoggedIn, uploads.single("avatar"), updateUser)



export default router
