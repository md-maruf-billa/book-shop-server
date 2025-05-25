import express from 'express';
import { user } from './server.js';
import bcrypt from "bcrypt";
const app = express()
app.use(express.json())
app.use(express.raw())


// manage response
const manageResponse = (res, data) => {
    res.
        status(data?.statusCode)
        .json({
            success: data?.success,
            message: data?.message,
            data: data?.data || null
        })
}



// testing route
app.get("/", async (req, res) => {
    // send response
    manageResponse(res, {
        success: true,
        statusCode: 200,
        message: "Server is running perfectly",
        data: null
    })

})


// create account
app.post("/register", async (req, res) => {
    // check is user exist
    const isUserExist = await user.findOne({ email: req?.body?.email })
    if (isUserExist) {
        manageResponse(res, {
            success: false,
            statusCode: 403,
            message: "User already registered!!"
        })
        return
    }
    // hash password for secure
    const hashPassword = bcrypt.hashSync(req?.body?.password, 10);
    const payload = {
        ...req?.body,
        password: hashPassword,
        createdAt: new Date(),
        lastPasswordChange: new Date()

    }
    const result = await user.insertOne(payload)
    manageResponse(res, {
        success: true,
        message: "Account Created successful",
        statusCode: 201,
        data: result
    })
})

app.post("/login", async (req, res) => {
    // check account exist
    const isUserExist = await user.findOne({ email: req?.body?.email })
    if (!isUserExist) {
        manageResponse(res, {
            success: false,
            statusCode: 404,
            message: "User account not found!!"
        })
        return
    }

    // password matching
    const matchPassword = bcrypt.compareSync(req?.body?.password, isUserExist?.password)
    if (!matchPassword) {
        manageResponse(res, {
            success: false,
            statusCode: 403,
            message: "Password incorrect !!"
        })
        return
    }
    manageResponse(res, {
        success: true,
        statusCode: 200,
        message: "User login successful",
        data: isUserExist
    })
    return
})

app.patch("/update-password", async (req, res) => {
    // check account exist
    const isUserExist = await user.findOne({ email: req?.body?.email })
    if (!isUserExist) {
        manageResponse(res, {
            success: false,
            statusCode: 404,
            message: "User account not found!!"
        })
        return
    }

    // password matching
    const matchPassword = bcrypt.compareSync(req?.body?.oldPassword, isUserExist?.password)
    if (!matchPassword) {
        manageResponse(res, {
            success: false,
            statusCode: 403,
            message: "Password incorrect !!"
        })
        return
    }

    const hashNewPassword = bcrypt.hashSync(req?.body?.newPassword, 10)
    const result = await user.updateOne({ email: isUserExist?.email }, {
        $set: {
            password: hashNewPassword
        }
    })
    manageResponse(res, {
        success: true,
        statusCode: 200,
        message: "Password Update successful.",
        data: result
    })
})


export default app;
