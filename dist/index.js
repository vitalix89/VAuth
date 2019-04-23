"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = __importDefault(require("body-parser"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_1 = __importDefault(require("express"));
const uuid_1 = __importDefault(require("uuid"));
//import  test from "vauth-system";
const app = express_1.default();
const users = new Map();
const sessions = new Map();
exports.test = () => {
    console.log("test");
};
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(cookie_parser_1.default());
// Login Middleware
app.use((req, res, next) => {
    const session = sessions.get(req.cookies.sessionId);
    if (session && session.sessionId) {
        req.session = { sessionId: session.sessionId, email: session.email };
        req.logout = () => {
            req.session = undefined;
            sessions.delete(session.sessionId);
        };
    }
    next();
});
app.get("/", (req, res) => {
    console.log("cookie...", req.cookies);
    console.log("sessions Map", sessions);
    res.redirect("/login");
});
app.get("/register", (req, res) => {
    res.send(`
  <h2>Register</h2>

  <form action="/register" method="post">
  Email:<br>
  <input type="text" name="email" >
  <br>
  Password:<br>
  <input type="password" name="password">
  <br><br>
  <input type="submit" value="Submit">
  </form> 

  
  `);
});
app.get("/login", (req, res) => {
    res.send(`
  <h2>Login</h2>

  <form action="/login" method="post">
  Email:<br>
  <input type="text" name="email" >
  <br>
  Password:<br>
  <input type="password" name="password">
  <br><br>
  <input type="submit" value="Submit">
  </form> 
  <a href="/register">Register</a>

  
  `);
});
app.get("/profile", (req, res) => {
    //  const userEmail = sessions.get(req.cookies.sessionId);
    console.log("REQ__SESSION___profile", req.session);
    if (req.session && req.session.email) {
        return res.send(`
    <h2>Welcome ${req.session.email} </h2>
    <a href="/logout">Logout</a>
    
    `);
    }
    res.redirect("/login");
});
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    const user = users.get(email);
    if (user && user.password === password) {
        const sessionId = uuid_1.default.v4();
        sessions.set(sessionId, { sessionId, email });
        res.cookie("sessionId", sessionId);
        return res.redirect("/profile");
    }
    console.log("USER.....?", user);
    res.redirect("/login");
});
app.post("/register", (req, res) => {
    const { email, password } = req.body;
    users.set(email, req.body);
    //res.cookie("session", "qjlnnd3894u0243234");
    res.redirect("/login");
});
app.get("/logout", (req, res) => {
    // const sessionId = req.cookies.sessionId;
    req.logout();
    res.redirect("/login");
});
app.listen(8000, () => {
    console.log("server runs on port 8000");
});
