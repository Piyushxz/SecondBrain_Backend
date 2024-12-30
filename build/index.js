"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const express_1 = __importDefault(require("express"));
const dotenv = __importStar(require("dotenv"));
const db_1 = require("./db");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_2 = require("./db");
const middleware_1 = require("./middlewares/middleware");
const getDate_1 = require("./utils/getDate");
const zod_1 = require("zod");
const cors_1 = __importDefault(require("cors"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const randomHash_1 = require("./utils/randomHash");
const app = (0, express_1.default)();
dotenv.config();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/", (req, res) => {
    console.log("ROUTE HIT");
    res.send("Hey");
});
app.post("/api/v1/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const requiredBody = zod_1.z.object({
        email: zod_1.z.string().min(11).max(50).email(),
        username: zod_1.z.string().min(5).max(15),
        password: zod_1.z.string().min(5).max(50)
    });
    try {
        const parsedBody = requiredBody.safeParse(req.body);
        if (!parsedBody.success) {
            res.status(400).json({ message: "Invalid Format" });
            return;
        }
        const { email, username, password } = parsedBody.data;
        const hashedPassword = yield bcrypt_1.default.hash(password, 2);
        let user = yield db_1.UserModel.findOne({ username });
        if (user) {
            res.status(409).json({ message: "User Already exists" });
            return;
        }
        yield db_1.UserModel.create({ username, password: hashedPassword });
        res.status(200).json({ message: "User created" });
    }
    catch (err) {
        res.status(404).json({ message: "Could not signup", error: err });
    }
}));
app.post("/api/v1/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.body.username;
    const password = req.body.password;
    let foundUser = null;
    try {
        foundUser = yield db_1.UserModel.findOne({ username });
        if (!foundUser) {
            res.status(401).json({ message: "User does not exist" });
            return;
        }
        //@ts-ignore
        const encryptedPass = yield bcrypt_1.default.compare(password, foundUser.password);
        if (encryptedPass) {
            const token = jsonwebtoken_1.default.sign({ id: foundUser._id }, process.env.SECRET_KEY);
            res.status(200).json({ message: "Signed IN!", token });
        }
        else {
            res.status(403).json({ message: "Invalid credentials" });
        }
    }
    catch (err) {
        res.status(404).json({ message: "Could not sign in", error: err });
    }
}));
app.post("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const title = req.body.title;
    const link = req.body.link;
    const type = req.body.type;
    const content = req.body.content;
    const tags = [...req.body.tags];
    //@ts-ignore
    const userId = req.userId;
    try {
        yield db_2.contentModel.create({
            title,
            link,
            type,
            tags: [...tags],
            content,
            createdAt: (0, getDate_1.getDate)(),
            userId
        });
        res.status(200).json({ message: "Content Added" });
    }
    catch (err) {
        res.status(403).json({ message: "Could not create" });
    }
}));
app.get("/api/v1/content/home", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    try {
        const contents = yield db_2.contentModel.find({ userId: userId }).populate("userId", "username");
        res.status(200).json({ contents });
    }
    catch (err) {
        res.status(403).json({ message: "Could not get content" });
    }
}));
app.get("/api/v1/content/:type", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const type = req.params.type;
    try {
        const contents = yield db_2.contentModel.find({ userId: userId, type: type }).populate("userId", "username");
        res.status(200).json({ contents });
    }
    catch (err) {
        res.status(403).json({ message: "Could not get content" });
    }
}));
app.delete("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const contentId = req.body.contentId;
    try {
        yield db_2.contentModel.deleteOne({ _id: contentId, userId: userId });
        res.status(200).json({ message: "Delted Successfully!" });
    }
    catch (err) {
        res.status(403).json({ message: "Could not delete" });
    }
}));
app.post("/api/v1/brain/share", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const share = req.body.share;
    //@ts-ignore
    const userId = req.userId;
    try {
        if (share) {
            const hash = (0, randomHash_1.random)(10);
            yield db_1.linkModel.create({
                hash: hash,
                userId: userId
            });
            res.status(200).json({ hash: hash, message: "Link generated" });
        }
        else {
            yield db_1.linkModel.deleteOne({
                userId
            });
            res.status(200).json({ message: "Link deleted" });
        }
    }
    catch (err) {
        res.status(403).json({ message: "Could not update Link" });
    }
}));
app.get("/api/v1/brain/:shareLink", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const hash = req.params.shareLink;
    try {
        const link = yield db_1.linkModel.findOne({
            hash: hash
        });
        if (!link) {
            res.status(411).json({ message: "Incorrect Input" });
            return;
        }
        const content = yield db_2.contentModel.find({
            userId: link.userId
        });
        const user = yield db_1.UserModel.findOne({
            _id: link.userId
        });
        res.status(200).json({
            user: user === null || user === void 0 ? void 0 : user.username,
            content: content
        });
    }
    catch (err) {
        res.status(403).json({ message: "Could not find " });
    }
}));
app.listen(3003, () => {
    console.log("Server Running");
    console.log(process.env.MONGO_URI, process.env.SECRET_KEY);
});
