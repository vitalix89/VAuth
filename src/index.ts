import BodyParser from "body-parser";
import cookieParser from "cookie-parser";
import express from "express";
import uuid from "uuid";
//import { test } from "vauth-system";

const app = express();

declare global {
  namespace Express {
    interface Request {
      cookies?: string | undefined;
      session?: Session;
      logout: () => void;
      login: (credentials: Credentials) => Human | undefined | Promise<Human>;
      login1?: () => void;
    }
  }
}

interface NextFunction {
  (err?: any): void;
}

interface RequestHandler {
  (req: Request, res: Response, next: NextFunction): any;
}

interface User {
  email: string;
  password: string;
}

interface Session {
  sessionId: string;
  email: string;
}

const users = new Map<string, User>();

const sessions = new Map<string, Session>();

// export const test = () => {
//   console.log("test");
// };

app.use(BodyParser.urlencoded({ extended: false }));
app.use(BodyParser.json());
app.use(cookieParser());

// Auth Middleware

const vAuthMiddleware = (req: any, res: any, next: any) => {
  const session = sessions.get(req.cookies.sessionId);

  if (session && session.sessionId) {
    req.session = { sessionId: session.sessionId, email: session.email };
    req.logout = () => {
      req.session = undefined;
      sessions.delete(session.sessionId);
    };
  }

  next();
};

// Login Middleware

app.use(vAuthMiddleware);

interface Credentials {
  username: string;
  password: string;
}

interface Human {
  name: string;
  age: number;
}

const db = new Map<string, Human>([["vitaly", { name: "Vitaly", age: 30 }]]);

// ok, now you need a way to receive callback from user
// interface BAuth {
//   userCallback?: (credentials: Credentials) => Human | undefined;
//   middleware(req: Express.Request, res: express.Response, next: express.NextFunction): void;
// }

class Bauth {
  req?: Express.Request | undefined;
  res: Express.Response | undefined;
  constructor(private userCallback: (credentials: Credentials) => Human | undefined) {
    //console.log("HI..........11111");
  }

  public middleware = (
    req: Express.Request & { cookies: any },
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const sessionId = req.cookies.sessionId;
    const session = sessions.get(sessionId);

    this.req = req;
    this.res = res;
    console.log("HI..........11111");

    if (session) {
      req.session = session;
    }

    req.login = (credentials: Credentials) => {
      const user = this.userCallback(credentials);
      const id = uuid.v4();

      // if (user !== undefined) {
      //   sessions.set(id, { email: user.name, sessionId: id });
      //   res.cookie("sessionId", id);
      // }

      // return user;

      return new Promise((resolve, reject) => {
        if (user !== undefined) {
          sessions.set(id, { email: user.name, sessionId: id });
          res.cookie("sessionId", id);
          return resolve(user);
        } else {
          const reason = new Error("user undefined");
          return reject(reason); // reject
        }
      });
    };

    next();
  };

  login1() {
    if (this.req) {
      console.log("LOGIN_1", this.req.cookies);
    }
  }
}

const bauth = new Bauth((credentials: Credentials) => db.get(credentials.username));

app.use(bauth.middleware);

bauth.login1();

// const bAuth: BAuth = {
//   userCallback: undefined,
//   middleware(
//     req: Express.Request & { cookies: any },
//     res: express.Response,
//     next: express.NextFunction,
//   ) {
//     const sessionId = req.cookies.sessionId;
//     const session = sessions.get(sessionId);

//     if (session) {
//       req.session = session;
//     }

//     req.login = function(credentials: Credentials) {
//       const user = this.userCallback(credentials);
//       const id = uuid.v4();

//       if (user !== undefined) {
//         sessions.set(id, user);
//         res.cookie("sessionId", id);
//       }

//       return user;
//     }.bind(bAuth);

//     next();
//   },
// };

/*
bAuth.userCallback = (credentials: Credentials) => {
  return db.get(credentials.username);
};
*/

app.post("/wtf-login", async (req, res) => {
  const credentials = req.body;
  const user = await req.login(credentials);
  console.log("USER>>>>>>>", await user);

  //console.log("LOGIN_222", req.cookies);

  bauth.login1();

  if (user) {
    return res.json(user);
  } else {
    res.send("login failed");
  }
});

app.get("/wtf-login", async (req, res) => {
  const credentials = req.body;
  // console.log("------------------------", await req.login(credentials));
  //const user = await req.login(credentials);

  //console.log("USER>>>>>>>", await user);

  //console.log("LOGIN_222", req.cookies);

  bauth.login1();

  try {
    const user = await req.login(credentials);

    return res.json(user);
  } catch (e) {
    return res.send("login failed");
  }

  // if (user) {
  //   return res.json(user);
  // } else {
  //   res.send("login failed");
  // }
});

// no i wond do it in my route i will export functions

// arrow function not work? it doesn't have this ok

app.get("/", (req, res) => {
  console.log("cookie...", req.cookies);

  console.log("sessions Map", sessions);

  //test();

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
    const sessionId = uuid.v4();

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

app.listen(8001, () => {
  console.log("server runs on port 8001");
});
