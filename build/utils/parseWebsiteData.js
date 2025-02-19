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
exports.getWebsiteMetadata = getWebsiteMetadata;
const puppeteer_1 = __importDefault(require("puppeteer"));
function getWebsiteMetadata(url) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const browser = yield puppeteer_1.default.launch({ headless: true }); // Launch headless browser
            const page = yield browser.newPage();
            // Wait until the page content is loaded
            yield page.goto(url, { waitUntil: 'domcontentloaded' });
            // Extract metadata from the website
            const metadata = yield page.evaluate((url) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
                const title = ((_a = document.querySelector("title")) === null || _a === void 0 ? void 0 : _a.textContent) || "No title found";
                const description = ((_b = document.querySelector("meta[name='description']")) === null || _b === void 0 ? void 0 : _b.getAttribute("content")) ||
                    ((_c = document.querySelector("meta[property='og:description']")) === null || _c === void 0 ? void 0 : _c.getAttribute("content")) || "No description found";
                const keywords = ((_d = document.querySelector("meta[name='keywords']")) === null || _d === void 0 ? void 0 : _d.getAttribute("content")) || "No keywords found";
                const ogImage = ((_e = document.querySelector("meta[property='og:image']")) === null || _e === void 0 ? void 0 : _e.getAttribute("content")) || "No image found";
                const canonicalURL = ((_f = document.querySelector("link[rel='canonical']")) === null || _f === void 0 ? void 0 : _f.getAttribute("href")) || url;
                const favicon = ((_g = document.querySelector("link[rel='icon']")) === null || _g === void 0 ? void 0 : _g.getAttribute("href")) || "No favicon found";
                const publishedDate = ((_h = document.querySelector("meta[property='article:published_time']")) === null || _h === void 0 ? void 0 : _h.getAttribute("content")) || "No published date found";
                const author = ((_j = document.querySelector("meta[name='author']")) === null || _j === void 0 ? void 0 : _j.getAttribute("content")) || "No author found";
                const pageType = ((_k = document.querySelector("meta[property='og:type']")) === null || _k === void 0 ? void 0 : _k.getAttribute("content")) || "No type found";
                // Extract the first paragraph or main content snippet
                const mainContentSnippet = ((_m = (_l = document.querySelector("p")) === null || _l === void 0 ? void 0 : _l.textContent) === null || _m === void 0 ? void 0 : _m.trim()) || "No main content available";
                return {
                    title,
                    description,
                    keywords,
                    ogImage,
                    canonicalURL,
                    favicon,
                    publishedDate,
                    author,
                    pageType,
                    mainContentSnippet,
                };
            }, url); // Pass the `url` here as a parameter
            yield browser.close(); // Close the browser
            return metadata; // Return the extracted metadata
        }
        catch (error) {
            console.error("Error fetching website metadata:", error);
            return null;
        }
    });
}
