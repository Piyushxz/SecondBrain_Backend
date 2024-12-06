import express from "express";
import * as dotenv from "dotenv"
import { linkModel, UserModel } from "./db";
import jwt from "jsonwebtoken"
import { contentModel } from "./db";
import { userMiddleware } from "./middlewares/middleware";
import { getDate } from "./utils/getDate";
import {z} from "zod"
import cors from "cors"
import bcrypt from "bcrypt"
import { random } from "./utils/randomHash";
const app = express()




dotenv.config()
app.use(cors())
app.use(express.json())


app.get("/",(req,res)=>{
    console.log("ROUTE HIT")
    res.send("Hey")
})
app.post("/api/v1/signup",async (req,res)=>{


    const requiredBody = z.object({
        email:z.string().min(11).max(50).email(),
        username:z.string().min(5).max(15),
        password:z.string().min(5).max(50)
    })

    try{

        const parsedBody = requiredBody.safeParse(req.body)

        if(!parsedBody.success){
            res.status(400).json({message:"Invalid Format"})
            return;
        }
        const {email,username,password} = parsedBody.data
        const hashedPassword = await bcrypt.hash(password,2)
        let user =await UserModel.findOne({username})
        if(user){
            res.status(409).json({message:"User Already exists"})
            return
        }

        await UserModel.create({username,password:hashedPassword});
        res.status(200).json({message:"User created"})

    }catch(err){
        res.status(404).json({message:"Could not signup",error:err})
    }
})

app.post("/api/v1/signin",async (req,res)=>{
    const username = req.body.username;
    const password = req.body.password;

   
    let foundUser = null;
    try{
        foundUser = await UserModel.findOne({username})

        if(!foundUser){
            res.status(401).json({message:"User does not exist"})
            return;
        }
        //@ts-ignore
        const encryptedPass = await bcrypt.compare(password,foundUser.password)
        if(encryptedPass){
            const token = jwt.sign({id:foundUser._id},process.env.SECRET_KEY);
            res.status(200).json({message:"Signed IN!",token})
            
        }else{

            res.status(403).json({message:"Invalid credentials"})
        }

    


    }catch(err){
        res.status(404).json({message:"Could not sign in",error:err},)
    }
})

app.post("/api/v1/content",userMiddleware, async (req,res)=>{
    const title = req.body.title;
    const link = req.body.link;
    const type = req.body.type;
    const content = req.body.content;

     const tags = [...req.body.tags]

    //@ts-ignore
    const userId = req.userId;

    try{
        await contentModel.create({
        title,
        link,
        type,
        tags:[...tags],
        content,
        createdAt:getDate(),
        userId})

        res.status(200).json({message:"Content Added"})
    }catch(err){

        res.status(403).json({message:"Could not create"})
    }

    

})

app.get("/api/v1/content",userMiddleware,async (req,res)=>{
    //@ts-ignore
    const userId = req.userId;
    try{
        const contents = await contentModel.find({userId:userId}).populate("userId","username");

        res.status(200).json({contents})
    }catch(err){
        res.status(403).json({message:"Could not get content"})
    }

    
})

app.delete("/api/v1/content",userMiddleware,async (req,res)=>{
        //@ts-ignore
        const userId = req.userId;
        const contentId = req.body.contentId;


        try{

            await contentModel.deleteOne({_id:contentId,userId:userId})
            res.status(200).json({message:"Delted Successfully!"})

        }catch(err){
            res.status(403).json({message:"Could not delete"})
        }

        
})

app.post("/api/v1/brain/share",userMiddleware,async (req,res)=>{
    const share = req.body.share;
    //@ts-ignore
    const userId = req.userId;
    try{
        if(share){
            const hash = random(10)
            await linkModel.create({
                hash:hash,
                userId:userId
            })
    
            res.status(200).json({hash:hash, message:"Link generated"})
        }
        else{
            await linkModel.deleteOne({
                userId
            })
    
            res.status(200).json({message:"Link deleted"})
        }
    }catch(err){
        res.status(403).json({message:"Could not update Link"})
    }

})

app.get("/api/v1/brain/:shareLink",async (req,res)=>{

    const hash = req.params.shareLink;

    try{

        const link = await linkModel.findOne({
            hash:hash
        })


        if(!link){
            res.status(411).json({message:"Incorrect Input"}
            )
            return;
        }


        const content = await contentModel.find({
            
            userId:link.userId
        })

        const user = await UserModel.findOne({
            _id:link.userId
        })


        res.status(200).json({
            user:user?.username,
            content:content
        })


    }catch(err){
        res.status(403).json({message:"Could not find "})
    }
})

app.listen(3003,()=>{
    console.log("Server Running")
    console.log(process.env.MONGO_URI,process.env.SECRET_KEY)
})
