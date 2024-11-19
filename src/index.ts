import express from "express";
import * as dotenv from "dotenv"
import { UserModel } from "./db";
import jwt from "jsonwebtoken"
import { contentModel } from "./db";
import { userMiddleware } from "./middlewares/middleware";
const app = express()




dotenv.config()

app.use(express.json())


app.get("/",(req,res)=>{
    console.log("ROUTE HIT")
    res.send("Hey")
})
app.post("/api/v1/signup",async (req,res)=>{

    const username = req.body.username;
    const password = req.body.password;


    try{

        let user =await UserModel.findOne({username})
        if(user){
            res.status(409).json({message:"User Already exists"})
            return
        }

        await UserModel.create({username,password});
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
        foundUser = await UserModel.findOne({username,password})

        if(foundUser==null){
            res.status(401).json({message:"Invalid Credentials"})
            return;
        }

        
        const token = jwt.sign({id:foundUser._id},process.env.SECRET_KEY);
        res.status(200).json({message:"Signed IN!",token})
        


    }catch(err){
        res.status(404).json({message:"Could not sign in"})
    }
})

app.post("api/vi/content",userMiddleware, async (req,res)=>{
    const title = req.body.title;
    const link = req.body.link;
    const tags = [...req.body.tags]

    //@ts-ignore
    const userId = req.userId;

    try{
        await contentModel.create({
        title,
        link,
        tags:[],
        userId})

        res.status(200).json({message:"Content Added"})
    }catch(err){

        res.status(403).json({message:"Could not create"})
    }

    

})



app.listen(3003,()=>{
    console.log("Server Running")
    console.log(process.env.MONGO_URI,process.env.SECRET_KEY)
})
