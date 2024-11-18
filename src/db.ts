import mongoose from "mongoose";
import { Schema,Model } from "mongoose";


const userSchema = new Schema({
    username : {type:String,unique:true},
    password: {type:String}
})

const User = new Model()