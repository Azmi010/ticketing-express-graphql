import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { User } from "../entities/User";
import { RegisterInput } from "../types/RegisterInput";
import * as bcrypt from "bcrypt";
import { Role } from "../entities/Role";
import { LoginInput } from "../types/LoginInput";
import { isAuth } from "../utils/isAuth";
import { MyContext } from "../utils/MyContext";
import { sign } from "jsonwebtoken";
import { LoginResponse } from "../types/LoginResponse";

@Resolver()
export class AuthResolver {
  @Query(() => String)
  @UseMiddleware(isAuth)
  async Me(@Ctx() { payload }: MyContext) {
    return `Your user id is: ${payload.userId}`;
  }

  @Mutation(() => User)
  async register(@Arg("data") data: RegisterInput): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const defaultRole = await Role.findOneBy({ id: 2 });

    if (!defaultRole) {
      throw new Error("Default role not found");
    }

    const user = await User.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: defaultRole,
      events: [],
      orders: [],
    }).save();
    return user;
  }

  @Mutation(() => LoginResponse)
  async login(@Arg("data") data: LoginInput): Promise<LoginResponse> {
    const user = await User.findOne({
      where: { email: data.email },
      relations: ["role"],
    });
    if (!user) {
      throw new Error("Email doesn't exist");
    }

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) {
      throw new Error("Incorrect password");
    }

    return {
      accessToken: sign(
        { userId: user.id, role: user.role.name },
        process.env.ACCESS_TOKEN_SECRET!,
        {
          expiresIn: "15m",
        }
      ),
    };
  }
}
