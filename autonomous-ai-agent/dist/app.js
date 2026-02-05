"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cors_1 = require("cors");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/health", (_, res) => {
    res.json({ status: "AI Agent API running 🚀" });
});
exports.default = app;
//# sourceMappingURL=app.js.map