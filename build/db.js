"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.linkModel = exports.tagModel = exports.contentModel = exports.UserModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongoose_2 = require("mongoose");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function connectDB() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose_1.default.connect("mongodb+srv://piyushsavale:o4rbYCxa6JxkBcR6@cluster0.qiepnx5.mongodb.net/SecondBrain");
            console.log("DB connected");
        }
        catch (err) {
            console.log("Coult not connect TO DB");
        }
    });
}
connectDB();
const userSchema = new mongoose_2.Schema({
    username: { type: String, unique: true },
    password: { type: String }
});
exports.UserModel = (0, mongoose_2.model)("User", userSchema);
const contentSchema = new mongoose_2.Schema({
    title: String,
    type: String,
    link: String,
    tags: [String],
    // tags:[{type:mongoose.Schema.ObjectId,ref:"Tag"}],
    content: String,
    createdAt: String,
    userId: { type: mongoose_1.default.Schema.ObjectId, ref: "User" }
});
exports.contentModel = (0, mongoose_2.model)("Contents", contentSchema);
const tagSchema = new mongoose_2.Schema({
    title: { type: String, unique: true }
});
exports.tagModel = (0, mongoose_2.model)("Tags", tagSchema);
const linkSchema = new mongoose_2.Schema({
    hash: String,
    userId: { type: mongoose_1.default.Schema.ObjectId, ref: "User", required: true }
});
exports.linkModel = (0, mongoose_2.model)("Links", linkSchema);
