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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getYouTubeVideoDetails = void 0;
const googleapis_1 = require("googleapis");
const youtubeURLtoID = (url) => {
    const urlObj = new URL(url);
    let videoId;
    if (urlObj.hostname.includes('youtube.com') && urlObj.searchParams.has('v')) {
        videoId = urlObj.searchParams.get('v');
    }
    else if (urlObj.hostname === 'youtu.be') {
        videoId = urlObj.pathname.slice(1); // Remove leading '/'
    }
    else if (urlObj.pathname.startsWith('/embed/')) {
        videoId = urlObj.pathname.split('/embed/')[1];
    }
    if (videoId && videoId.length === 11) {
        return videoId;
    }
    else {
        return null;
    }
};
const getYouTubeVideoDetails = (videoLink) => __awaiter(void 0, void 0, void 0, function* () {
    const videoId = youtubeURLtoID(videoLink);
    if (videoId === null) {
        console.log("Invalid Video Link");
        return;
    }
    try {
        const youtube = googleapis_1.google.youtube({
            version: "v3",
            auth: "AIzaSyDWicQlGLATs21SNbJeafSm-litjsFck74", // Replace with your API Key
        });
        // Get the video details
        //@ts-ignore
        const response = yield youtube.videos.list({
            part: ["snippet"], // Specify parts as an array of strings
            id: videoId,
        });
        // Check if the response contains valid data
        //@ts-ignore
        const items = response.data.items;
        if (items && items.length > 0) {
            const videoDetails = items[0].snippet;
            const videoMetadata = {
                title: (videoDetails === null || videoDetails === void 0 ? void 0 : videoDetails.title) || "No Title",
                description: (videoDetails === null || videoDetails === void 0 ? void 0 : videoDetails.description) || "No Description",
                publishedAt: (videoDetails === null || videoDetails === void 0 ? void 0 : videoDetails.publishedAt) || "No Publish Date",
                channelTitle: (videoDetails === null || videoDetails === void 0 ? void 0 : videoDetails.channelTitle) || "No Channel Title",
            };
            console.log(videoMetadata);
            return videoMetadata;
        }
        else {
            console.error("Video not found.");
        }
    }
    catch (error) {
        console.error("Error fetching video details:", error);
    }
});
exports.getYouTubeVideoDetails = getYouTubeVideoDetails;
