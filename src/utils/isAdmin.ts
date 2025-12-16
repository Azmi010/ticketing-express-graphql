import { MiddlewareFn } from "type-graphql";
import { MyContext } from "./MyContext";

export const isAdmin: MiddlewareFn<MyContext> = ({ context }, next) => {
    if (!context.payload) {
        throw new Error("Not authenticated");
    }

    if (context.payload?.role !== "admin") {
        throw new Error("Access denied, Admin only!");
    }

    return next();
}