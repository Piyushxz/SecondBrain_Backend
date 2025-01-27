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
const js_client_rest_1 = require("@qdrant/js-client-rest");
const linkType_1 = require("./utils/linkType");
const generative_ai_1 = require("@google/generative-ai");
const uuid_1 = require("uuid");
const tweetParse_1 = require("./utils/tweetParse");
const checkURLtype_1 = __importDefault(require("./utils/checkURLtype"));
const parseWebsiteData_1 = require("./utils/parseWebsiteData");
const mongoose_1 = require("mongoose");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const app = (0, express_1.default)();
dotenv.config();
app.use((0, cors_1.default)());
app.options("*", (0, cors_1.default)());
app.use(express_1.default.json());
const client = new js_client_rest_1.QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_KEY,
});
const insertDB = (link) => __awaiter(void 0, void 0, void 0, function* () {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    try {
        // Generate a unique ID for the point
        const linkType = (0, checkURLtype_1.default)(link.url);
        console.log(link.url);
        let parsedURLContent = null;
        if (linkType === `youtube`) {
            parsedURLContent = yield (0, linkType_1.getYouTubeVideoDetails)(link.url);
        }
        else if (linkType === `tweet`) {
            parsedURLContent = yield (0, tweetParse_1.getTweetDetails)(link.url);
        }
        else if (linkType === 'link') {
            parsedURLContent = yield (0, parseWebsiteData_1.getWebsiteMetadata)(link.url);
        }
        console.log(parsedURLContent);
        if (!parsedURLContent) {
            parsedURLContent = 'no parsed data';
        }
        const result = yield model.embedContent([link.content, link.url, JSON.stringify(parsedURLContent), link.type]);
        // Create the point data for insertion
        const point = {
            id: link._id, // Use a unique ID for the vector
            vector: result.embedding.values,
            payload: {
                contentId: link.contentId,
                content: link.content,
                userId: link.userId,
                url: link.url,
                type: link.type,
                description: link.description,
                parsedContent: JSON.stringify(parsedURLContent)
            },
        };
        // Upsert the point into the collection
        yield client.upsert('test_collection', {
            wait: true,
            points: [point], // Pass the point as an array
        });
        console.log("Inserted into QdrantDB");
    }
    catch (error) {
        console.error("Error generating embedding or inserting into database:", error);
        throw error;
    }
});
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
            res.status(200).json({ message: "Signed IN!", token, username: foundUser.username });
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
    const unqID = (0, uuid_1.v4)();
    //@ts-ignore
    const userId = req.userId;
    try {
        const data = yield db_2.contentModel.create({
            title,
            link,
            type,
            tags: [...tags],
            content,
            createdAt: (0, getDate_1.getDate)(),
            userId
        });
        console.log({ _id: unqID, content: title, url: link, type: type, description: content, userId: userId, contentId: data._id });
        yield insertDB({ _id: unqID, content: title, url: link, type: type, description: content, userId: userId, contentId: data._id });
        console.log(JSON.stringify(data._id));
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
    let contentId = req.body.contentId;
    if (!contentId || !mongoose_1.Types.ObjectId.isValid(contentId)) {
        res.status(400).json({ message: "Invalid or missing contentId" });
        return;
    }
    contentId = new mongoose_1.Types.ObjectId(req.body.contentId);
    if (!contentId || !mongoose_1.Types.ObjectId.isValid(contentId)) {
        res.status(400).json({ message: "Invalid or missing contentId" });
        return;
    }
    const filter = {
        must: [
            { key: "contentId", match: { value: contentId } }
        ]
    };
    try {
        yield db_2.contentModel.deleteOne({ _id: contentId, userId: userId });
        yield client.delete('test_collection', {
            filter: filter
        });
        res.status(200).json({ message: "Delted Successfully!" });
        console.log(contentId, "deleted");
    }
    catch (err) {
        res.status(403).json({ message: "Could not delete" });
        console.log(err);
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
app.post("/api/v1/search", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.body.query;
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    //@ts-ignore
    const userId = req.userId;
    try {
        const result = yield model.embedContent(query);
        const filter = {
            must: [
                { key: "userId", match: { value: userId } }
            ]
        };
        const searchResults = yield client.search('test_collection', {
            vector: result.embedding.values,
            filter: filter,
            limit: 3,
            with_payload: true,
            with_vector: false
        });
        console.log("Search result", searchResults);
        const context = searchResults
            .map(result => {
            var _a, _b, _c, _d;
            return JSON.stringify({
                content: ((_a = result.payload) === null || _a === void 0 ? void 0 : _a.content) || "No content available",
                description: ((_b = result.payload) === null || _b === void 0 ? void 0 : _b.description) || "No description",
                url: ((_c = result.payload) === null || _c === void 0 ? void 0 : _c.url) || "No URL available",
                parsedContent: ((_d = result.payload) === null || _d === void 0 ? void 0 : _d.parsedContent) || "No parsed content"
            });
        })
            .join('\n\n');
        console.log(context);
        const answerModel = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `
        Context: ${context}\n\n
        Query: ${query}\n\n
        Use the context as supportive information, but provide a detailed and well-rounded answer using your general knowledge and reasoning.
        If no context is found, suggest possible actions the user can take to add or improve their data.
        `;
        const answerResult = yield answerModel.generateContent(prompt);
        const answer = answerResult.response.text();
        res.status(200).json({
            query: query,
            context: context,
            answer: answer,
            sources: searchResults.map(result => result.payload)
        });
    }
    catch (error) {
        console.error("Search error:", error);
        res.status(500).json({
            message: "Error performing search",
        });
    }
}));
app.listen(3003, () => {
    console.log("Server Running");
    console.log(process.env.MONGO_URI, process.env.SECRET_KEY);
});
