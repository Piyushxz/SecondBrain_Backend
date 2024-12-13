import mongoose from "mongoose";
import { Schema,Model,model } from "mongoose";
import dotenv from "dotenv"

dotenv.config()
async function connectDB() {
    try{
        
    await mongoose.connect("mongodb+srv://piyushsavale:o4rbYCxa6JxkBcR6@cluster0.qiepnx5.mongodb.net/SecondBrain")
        console.log("DB connected")
    }catch(err){
        console.log("Coult not connect TO DB")
    }
}

connectDB()

const userSchema = new Schema({
    username : {type:String,unique:true},
    password: {type:String}
})



export const UserModel = model("User",userSchema);

const contentSchema = new Schema({
    title:String,
    type:String,
    link:String,
    tags:[String],
    // tags:[{type:mongoose.Schema.ObjectId,ref:"Tag"}],
    
    content:String,
    createdAt:String,
    userId:{type:mongoose.Schema.ObjectId,ref:"User"}
})




export const contentModel= model("Contents",contentSchema)




const tagSchema = new Schema({
    title:{type:String, unique:true}
})

export const tagModel = model("Tags",tagSchema)



const linkSchema = new Schema({
    hash:String,
    userId:{type:mongoose.Schema.ObjectId,ref:"User",required:true}
})

export const linkModel = model("Links",linkSchema);
