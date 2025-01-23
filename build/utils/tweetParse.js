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
exports.getTweetDetails = void 0;
const axios_1 = __importDefault(require("axios"));
const twitterBearerToken = process.env.TWEET_BEARER;
const extractTweetID = (url) => {
    const match = url.match(/status\/(\d+)/);
    return match ? match[1] : null;
};
const getTweetDetails = (tweetURL) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        console.log(`Processing Tweet URL: ${tweetURL}`);
        const tweetID = extractTweetID(tweetURL);
        if (!tweetID) {
            throw new Error("Invalid Twitter URL: Unable to extract tweet ID.");
        }
        console.log(`Extracted Tweet ID: ${tweetID}`);
        const twitterAPIURL = `https://api.twitter.com/2/tweets/${tweetID}`;
        console.log(`Calling Twitter API: ${twitterAPIURL}`);
        const response = yield axios_1.default.get(twitterAPIURL, {
            headers: {
                Authorization: `Bearer ${twitterBearerToken}`
            },
            params: {
                expansions: "author_id",
                "tweet.fields": "created_at,text,public_metrics",
                "user.fields": "username,name"
            }
        });
        console.log("Raw API Response:", JSON.stringify(response.data, null, 2));
        const tweet = (_a = response.data) === null || _a === void 0 ? void 0 : _a.data;
        const author = (_d = (_c = (_b = response.data) === null || _b === void 0 ? void 0 : _b.includes) === null || _c === void 0 ? void 0 : _c.users) === null || _d === void 0 ? void 0 : _d[0]; // Check if `includes` exists
        if (!tweet) {
            throw new Error("No tweet data found for the given ID.");
        }
        const tweetDetails = {
            text: tweet.text,
            createdAt: tweet.created_at,
            author: {
                id: (author === null || author === void 0 ? void 0 : author.id) || "Unknown",
                username: (author === null || author === void 0 ? void 0 : author.username) || "Unknown",
                name: (author === null || author === void 0 ? void 0 : author.name) || "Unknown",
            },
            metrics: tweet.public_metrics || {}
        };
        console.log("Parsed Tweet Details:", tweetDetails);
        return tweetDetails;
    }
    catch (error) {
        console.error("Error fetching tweet details:", ((_e = error === null || error === void 0 ? void 0 : error.response) === null || _e === void 0 ? void 0 : _e.data) || error.message);
        return null;
    }
});
exports.getTweetDetails = getTweetDetails;
