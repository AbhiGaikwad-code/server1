import User from "../models/userModels.js";
import { razorpay } from "../server.js";
import AppError from "../uttils/error.uttils.js";

export const getRazorpayApiKey = async(req, res, next) => {
      try {
        res.status(200).json({
            success: true,
            message: 'Razorpay API key',
            key : process.env.RAZORPAY_KEY_ID
          })
    
    }
    catch (e) {
        return next (
            new AppError(e.message, 400)

        )
        
    }

}

export const buyScription = async(req, res, next) => {
    try {
        const {} = req.user;
    const user = await User.findById(id)

    if(!user) {
        return next(
            new AppError('Unauthorized, Please login')
        )
    }

    if(user.role === 'ADMIN'){
        return next(
            new AppError (
                'Admin cannot purchase a subcription', 400
            )
        )
    }

    const subcription = await razorpay.subcription.create({
         plan_id: process.env.RAZORPAY_PLAN_ID,
         coutomer_notify
    })

    user.subcription.id = subcription.id
    user.subcription.status = subcription.status

        await user.save()

        res.status(200).json({
            success: true,
            message: 'Subcribed successfully',
            subcription_id: subcription.id
        })
    } catch (e) {
        return next (
            new AppError(e.message, 400)

        )
        
    }


    
}

export const verifySubcription = async(req, res, next) => {
       try {
        const {id} = req.user;
    const {razorpay_payment_id, razorpay_signature, razorpay_subcription_id} = req.body
    
    const user = await User.findById(id)
    if(!user) {
        return next(
            new AppError('Unauthorized, Please login')
        )
    }

    const subcriptionId = user.subcription.id

    const generateSignature = crypto 
         .createHmac('sha256', process.env.RAZORPAY_SECRET)
         .update(`${razorpay_payment_id}|${subcriptionId}`)
         .digest('hex')

         if(generateSignature !== razorpay_signature){
            return next (
                new AppError('payment not verified , pleses try again later', 500)
            )
         }
         await Payment.create({
            razorpay_payment_id,
            razorpay_signature,
            razorpay_subcription_id
         })

         user.subcription.status = 'active'
         await user.save()

         rea.status(200).json({
            success: true,
            message: 'PAyment verfied successfully'
         })
        
       } catch (e) {
           return next (
               new AppError(e.message, 500)
           )
        
       }
}

export const cancelSubcription = async(req, res, next) => {

   try {
    
    const {id} = req.body
    const user = await User.findById(id)

    if(!user) {
        return next(
            new AppError('Unauthorized, Please login')
        )
    }

    if(user.role === 'ADMIN'){
        return next(
            new AppError (
                'Admin cannot purchase a subcription', 400
            )
        )
    }

    const subcriptionId = user.subcription.Id

    const subcription = await razorpay.subscriptions.cancel(
        subcriptionId

    )

    user.subcription.status = subcription.status

    await user.save()


   } catch (e) {

      return next (
        new AppError(e.message, 500)
      )
    
   }  
}
export const allPayments = async(req, res, next) => {

    try {
        const {count} = req.body

        const subcriptions = await razorpay.subcriptions.all({
            count: count || 10,
    })

    res.status(200).json({
        success: true,
        message: 'All payments',
        subcriptions
    })
        
    } catch (e) {
        
      return next (
        new AppError(e.message, 500)
      )
    }
}