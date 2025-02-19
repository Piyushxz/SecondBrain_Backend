"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = checkLinkType;
function checkLinkType(url) {
    if (isYouTubeUrl(url)) {
        return `youtube`;
    }
    else if (isTweetUrl(url)) {
        return `tweet`;
    }
    else {
        return `link`;
    }
}
function isYouTubeUrl(url) {
    const youtubeRegex = /^(https:\/\/(?:www\.)?youtube\.com\/(?:watch\?v=|(?:v|e(?:mbed)?)\/)([a-zA-Z0-9_-]{11})|https:\/\/youtu\.be\/([a-zA-Z0-9_-]{11}))/;
    return youtubeRegex.test(url);
}
function isTweetUrl(url) {
    const tweetRegex = /^(https:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/(?:.*\/)*status\/\d+)/;
    return tweetRegex.test(url);
}
