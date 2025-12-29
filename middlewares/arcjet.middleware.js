import aj from "../config/arcjet.js";

const arcjetMiddleware = async (req, res, next) => {
    try {
        if (!req.headers["user-agent"]) req.headers["user-agent"] = "unknown";
        const decision = await aj.protect(req, {requested:1});
        if (decision.isDenied()) {
            if (decision.reason?.isRateLimit()) return res.status(429).json({ error: "Too Many Requests" });
            if (decision.reason?.isBot()) return res.status(403).json({ error: "Bot Detected" });
            return res.status(403).json({ error: "Access Denied" });
        }
        next();
    } catch (error) {
        console.error("Arcjet Middleware Error:", error);
        return res.status(429).json({ error: "Too Many Requests" });
    }
};

export default arcjetMiddleware;
