"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.random = void 0;
const random = (num) => {
    const key = "abab45GASafafs34243efqQqE";
    const len = key.length;
    let ans = "";
    for (let i = 0; i < num; i++) {
        ans = ans + key[(Math.floor(Math.random() * len))];
    }
    return ans;
};
exports.random = random;
