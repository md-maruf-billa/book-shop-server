import express, { application } from 'express';
import { book, order, user } from './server.js';
import bcrypt from "bcrypt";
import upload from './multer.js';
import uploadCloud from './cludinary.js';
import { ObjectId } from 'mongodb';
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

//-----------user auth--------------//
// create account
app.post("/register", upload.single("image"), async (req, res) => {
    // parse data
    req.body = JSON.parse(req?.body?.data)
    // upload image on cloudinary
    const uploadImageLink = await uploadCloud(req?.file)
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
        profilePhoto: uploadImageLink?.secure_url,
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
            password: hashNewPassword,
            lastPasswordChange: new Date()
        }
    })
    manageResponse(res, {
        success: true,
        statusCode: 200,
        message: "Password Update successful.",
        data: result
    })
})


//--------- Book apis -----------//

// post book
app.post("/book", upload.single("image"), async (req, res) => {
    // parse body
    req.body = JSON.parse(req?.body?.data)
    // upload image on cloudinary
    const uploadedImage = await uploadCloud(req?.file)


    // find book valid creator
    const isAdmin = await user.findOne({ email: req?.body?.adminEmail })
    if (!isAdmin) {
        manageResponse(res, {
            success: false,
            statusCode: 404,
            message: "Admin account not found!!"
        })
        return
    }
    if (isAdmin.accountType !== "admin") {
        manageResponse(res, {
            success: false,
            statusCode: 403,
            message: "You are not authorized!!"
        })
        return
    }
    const payload = {
        ...req?.body,
        bookImage: uploadedImage?.secure_url,
        createdAt: new Date(),
        updateAt: new Date()
    }

    const result = await book.insertOne(payload)
    manageResponse(res, {
        statusCode: 201,
        success: true,
        message: "Book created successful",
        data: result
    })

})

// get all book
app.get("/book", async (req, res) => {
    const result = await book.find().toArray()
    manageResponse(res, {
        statusCode: 200,
        success: true,
        message: "Books fetched successful",
        data: result
    })
})

// get specific book
app.get("/book/:id", async (req, res) => {
    const { id } = req?.params;
    const result = await book.findOne({ _id: new ObjectId(id) })
    if (!result) {
        manageResponse(res, {
            statusCode: 404,
            success: false,
            message: "Book information not found !!",
            data: null
        })
        return
    }
    manageResponse(res, {
        statusCode: 200,
        success: true,
        message: "Book fetched successful",
        data: result
    })
})

app.delete("/book/:id", async (req, res) => {
    const { id } = req?.params
    const { email } = req?.query;
    // first find admin account
    const isAdmin = await user.findOne({ email })
    if (!isAdmin) {
        manageResponse(res, {
            success: false,
            statusCode: 404,
            message: "Admin account not found!!"
        })
        return
    }
    if (isAdmin.accountType !== "admin") {
        manageResponse(res, {
            success: false,
            statusCode: 403,
            message: "You are not authorized!!"
        })
        return
    }

    const result = await book.deleteOne({ _id: new ObjectId(id) })
    manageResponse(res, {
        statusCode: 200,
        message: "Book deleted successful",
        success: false,
        data: result
    })
})


//------------order api-------------//
app.post("/order", async (req, res) => {
    const isVerifiedUser = await user.findOne({ email: req?.body?.userEmail, accountType: "user" })
    if (!isVerifiedUser) {
        manageResponse(res, {
            success: false,
            statusCode: 404,
            message: "User account not found or not authorize!!"
        })
        return
    }
    const payload = {
        ...req?.body,
        createdAt: new Date(),
        updateAt: new Date()
    }
    const result = await order.insertOne(payload)
    manageResponse(req, {
        statusCode: 201,
        message: "Order Created successful",
        success: true,
        data: result
    })
})



export default app;
