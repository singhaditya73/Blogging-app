import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { sign } from "hono/jwt";
 
export const userRouter = new Hono<{
    Bindings: {
      DATABASE_URL: string;
      JWT_SECRET: string;
    },
      Variables: {
          userId : string;
      }
  }>();

userRouter.post("/signup", async (c) => {
    const body = await c.req.json();
    const prisma = new PrismaClient({
      datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());
  
    
  
    try {
      const user = await prisma.user.create({
        data: {
          name: body.name,
          email: body.email,
          password: body.password,
        },
      });
      const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
      return c.json({ jwt });
    } catch (e) {
      console.error("Error during signup:", e);
      return c.json({ message: "Internal server error" }, 500);
    }
  });
  
  userRouter.post("/signin", async (c) => {
    const prisma = new PrismaClient({
      datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());
  
    try {
      const body = await c.req.json();
      const user = await prisma.user.findUnique({
        where: {
          email: body.email,
          password: body.password,
        },
      });
  
      if (!user) {
        c.status(403);
        return c.json({ error: "user not found" });
      }
  
      const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
      return c.json({ jwt });
    } catch (e) {
      c.status(411);
      return c.text("invalid");
    }
  });

