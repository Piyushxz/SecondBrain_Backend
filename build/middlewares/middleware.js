"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userMiddleware = (req, res, next) => {
    const token = req.headers.authorization;
    const decodedUser = jsonwebtoken_1.default.verify(token, process.env.SECRET_KEY);
    if (decodedUser) {
        //@ts-ignore
        req.userId = decodedUser.id;
        next();
    }
    else {
        res.status(403).json({ message: "You are not logged In" });
    }
};
exports.userMiddleware = userMiddleware;
