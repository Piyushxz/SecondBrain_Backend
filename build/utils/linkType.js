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
exports.getYouTubeTranscript = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const getYouTubeTranscript = (url) => __awaiter(void 0, void 0, void 0, function* () {
    const browser = yield puppeteer_1.default.launch();
    const page = yield browser.newPage();
    yield page.goto(url);
    try {
        // Extract transcript text
        const transcript = yield page.evaluate(() => {
            // Cast elements to HTMLElement to access innerText
            const transcriptElements = document.querySelectorAll(".your-selector"); // Replace with the actual selector
            return Array.from(transcriptElements)
                .map(el => el.innerText) // Cast Element to HTMLElement
                .join(" ");
        });
        yield browser.close();
        console.log(transcript);
        return transcript;
    }
    catch (err) {
        console.error("Error fetching transcript:");
        yield browser.close();
        throw err;
    }
});
exports.getYouTubeTranscript = getYouTubeTranscript;
