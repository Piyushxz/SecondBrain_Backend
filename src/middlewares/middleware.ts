import { Request,Response,NextFunction } from "express";
import jwt from "jsonwebtoken"

export const userMiddleware = (req:Request,res:Response,next:NextFunction) =>{
    const token = req.headers.authorization;
    const decodedUser = jwt.verify(token as string, process.env.SECRET_KEY);


    if(decodedUser){
        //@ts-ignore
        req.userId = decodedUser.id
        next()
    }
    else{
        res.status(403).json({message:"You are not logged In"})
    }
}