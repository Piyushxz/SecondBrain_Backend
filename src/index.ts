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
import {QdrantClient} from '@qdrant/js-client-rest'
import { getYouTubeVideoDetails } from "./utils/linkType";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { v4 } from "uuid";
import { getTweetDetails } from "./utils/tweetParse";
import checkLinkType from "./utils/checkURLtype";
import { getWebsiteMetadata } from "./utils/parseWebsiteData";
import { Types } from "mongoose";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });



const app = express()




dotenv.config()

app.use(cors());
app.options("*", cors());

app.use(express.json())



const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_KEY,
});




interface Link {
    _id:any,
    url:string,
    type:string,
    description?:string,
    content:string,
    userId:string,
    contentId:Types.ObjectId
}
const insertDB = async (link: Link) => {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

    try {
        // Generate a unique ID for the point

        const linkType = checkLinkType(link.url)
        console.log(link.url)
        let parsedURLContent=null;
        if(linkType===`youtube`){
            parsedURLContent = await getYouTubeVideoDetails(link.url);

        }else if(linkType === `tweet`){
            parsedURLContent = await getTweetDetails(link.url)
        }
        else if(linkType === 'link'){
            parsedURLContent = await getWebsiteMetadata(link.url)
        }

        console.log(parsedURLContent)
        if(!parsedURLContent){
            parsedURLContent = 'no parsed data'
        }
        const result = await model.embedContent([link.content, link.url,JSON.stringify(parsedURLContent),link.type]);

        // Create the point data for insertion
        const point = {
            id: link._id, // Use a unique ID for the vector
            vector: result.embedding.values,
            payload: {
                contentId:link.contentId,
                content: link.content,
                userId:link.userId,
                url: link.url,
                type: link.type,
                description: link.description,
                parsedContent:JSON.stringify(parsedURLContent)
            },
        };

        // Upsert the point into the collection
        await client.upsert('test_collection', {
            wait: true,
            points: [point], // Pass the point as an array
        });
        console.log("Inserted into QdrantDB");

    } catch (error) {
        console.error("Error generating embedding or inserting into database:", error);
        throw error;
    }
};

interface SearchConfig {
    shard_key?: string | number | (string | number)[];
    vector: number[];
    [key: string]: any; // Allows any additional properties
}



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
            res.status(200).json({message:"Signed IN!",token,username:foundUser.username})
            
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
    const unqID = v4()
    //@ts-ignore
    const userId = req.userId;

    try{
        const data = await contentModel.create({
        title,
        link,
        type,
        tags:[...tags],
        content,
        
        createdAt:getDate(),
        userId})

        console.log({_id:unqID,content:title,url:link,type:type,description:content,userId:userId,contentId:data._id})
        await insertDB({_id:unqID,content:title,url:link,type:type,description:content,userId:userId,contentId:data._id})
        console.log(JSON.stringify(data._id))
        res.status(200).json({message:"Content Added"})

    }catch(err){

        res.status(403).json({message:"Could not create"})
    }

    

})

app.get("/api/v1/content/home",userMiddleware,async (req,res)=>{
    //@ts-ignore
    const userId = req.userId;
    try{
        const contents = await contentModel.find({userId:userId}).populate("userId","username");

        res.status(200).json({contents})
    }catch(err){
        res.status(403).json({message:"Could not get content"})
    }

    
})

app.get("/api/v1/content/:type",userMiddleware,async(req,res)=>{
        //@ts-ignore
        const userId = req.userId;
        const type = req.params.type
        try{
            const contents = await contentModel.find({userId:userId,type:type}).populate("userId","username");
    
            res.status(200).json({contents})
        }catch(err){
            res.status(403).json({message:"Could not get content"})
        }

})
app.delete("/api/v1/content",userMiddleware,async (req,res)=>{
        //@ts-ignore
        const userId = req.userId;
        let contentId = req.body.contentId;
        if (!contentId || !Types.ObjectId.isValid(contentId)) {
             res.status(400).json({ message: "Invalid or missing contentId" });
             return;
          }
          
        contentId = new Types.ObjectId(req.body.contentId);

        if (!contentId || !Types.ObjectId.isValid(contentId)) {
             res.status(400).json({ message: "Invalid or missing contentId" });
             return;
        }
        const filter = {
            must: [
                { key: "contentId", match: { value: contentId } } 
            ]
        };

        try{

            await contentModel.deleteOne({_id:contentId,userId:userId})
            await client.delete('test_collection',{
                filter:filter
            })
            res.status(200).json({message:"Delted Successfully!"})
            console.log(contentId,"deleted")

        }catch(err){
            res.status(403).json({message:"Could not delete"})
            console.log(err)
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


app.post("/api/v1/search",userMiddleware, async (req, res) => {
    const query = req.body.query;
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        //@ts-ignore
        const userId = req.userId;
    try {
        const result = await model.embedContent(query);
        const filter = {
            must: [
                { key: "userId", match: { value: userId } } 
            ]
        };


        const searchResults = await client.search('test_collection', {
            vector: result.embedding.values,
            filter:filter,
            limit: 3,
            with_payload: true,
            with_vector: false
        });
        console.log("Search result",searchResults)
        

        const context = searchResults
        .map(result => JSON.stringify({
            content: result.payload?.content || "No content available",
            description:result.payload?.description || "No description",
            url: result.payload?.url || "No URL available",
            parsedContent:result.payload?.parsedContent ||"No parsed content"
            
        }))
        .join('\n\n');
        
        console.log(context)
        
        const answerModel = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `
        Context: ${context}\n\n
        Query: ${query}\n\n
        Use the context as supportive information, but provide a detailed and well-rounded answer using your general knowledge and reasoning.
        If no context is found, suggest possible actions the user can take to add or improve their data.
        `;
        const answerResult = await answerModel.generateContent(prompt);
        const answer = answerResult.response.text();

         res.status(200).json({
            query: query,
            context: context,
            answer: answer,
            sources: searchResults.map(result => result.payload)
        });

    } catch (error) {
        console.error("Search error:", error);
         res.status(500).json({ 
            message: "Error performing search", 

        });
    }
});




app.listen(3003,()=>{


    console.log("Server Running")
    console.log(process.env.MONGO_URI,process.env.SECRET_KEY)
})

