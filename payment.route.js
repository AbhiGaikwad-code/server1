import {Router} from 'express'
import { allPayments, buyScription, cancelSubcription, getRazorpayApiKey, verifySubcription } from '../controllers/payment.controller.js'
import { authorizedRoles, isLoggedIn } from '../middlewares/auth.middleware.js'

const router = Router()

router 
    .route('/razorpay-key')
    .get(
        isLoggedIn,
        getRazorpayApiKey
    )
router
     .route('/subcribe')
     .post(
        isLoggedIn,
        buyScription
    )
router
      .route('/verify')
      .post(
        isLoggedIn,
        verifySubcription
    )
router
      .route('/unsubcribe')
      .post(
        isLoggedIn,
        cancelSubcription
     )
router
      .route('/')
      .get(  
        isLoggedIn,
        authorizedRoles('ADMIN'),
        allPayments
    )


export default router