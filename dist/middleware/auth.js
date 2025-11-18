import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
export async function authMiddleware(request, reply) {
    const token = request.headers.authorization?.replace("Bearer ", "");
    if (!token) {
        return reply.status(401).send({ error: "Missing token" });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const req = request;
        req.userId = decoded.userId;
        req.email = decoded.email;
    }
    catch (err) {
        return reply.status(401).send({ error: "Invalid token" });
    }
}
export function generateAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}
export function generateRefreshToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
//# sourceMappingURL=auth.js.map