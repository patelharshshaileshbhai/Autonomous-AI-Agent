"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const PORT = process.env.PORT || 4000;
app_1.default.listen(PORT, () => {
    console.log(`🔥 Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map