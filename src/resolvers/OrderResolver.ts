import { Arg, Ctx, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { Order } from "../entities/Order";
import { MyContext } from "../utils/MyContext";
import { OrderInput } from "../types/OrderInput";
import { isAuth } from "../utils/isAuth";
import { redis } from "../config/redis";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { OrderDetail } from "../entities/OrderDetail";
import { Ticket } from "../entities/Ticket";
import { isAdmin } from "../utils/isAdmin";

@Resolver()
export class OrderResolver {
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth, isAdmin)
  async syncStockToRedis() {
    const tickets = await Ticket.find();
    for (const ticket of tickets) {
      await redis.set(`ticket:${ticket.id}:quota`, ticket.quota);
    }
    return true;
  }

  @Query(() => [Order])
  @UseMiddleware(isAuth, isAdmin)
  async orders() {
    return Order.find({ relations: ["details", "user", "details.ticket", "details.ticket.event"] });
  }

  @Query(() => [Order])
  @UseMiddleware(isAuth)
  async myOrders(@Ctx() { payload }: MyContext) {
    return Order.find({
      where: { user: { id: parseInt(payload!.userId) } },
      relations: ["details", "details.ticket", "details.ticket.event"],
      order: { createdAt: "DESC" }
    });
  }

  @Mutation(() => Order)
  @UseMiddleware(isAuth)
  async createOrder(
    @Arg("items", () => [OrderInput]) items: OrderInput[],
    @Ctx() { payload }: MyContext
  ): Promise<Order> {
    const redisKeys: string[] = [];
    const redisArgs: string[] = [];

    for (const item of items) {
      redisKeys.push(`ticket:${item.ticketId}:quota`);
      redisArgs.push(item.qty.toString());
    }

    const luaScript = `
            for i, key in ipairs(KEYS) do
                local stock = tonumber(redis.call('get', key) or 0)
                local qty = tonumber(ARGV[i])
                if stock < qty then
                return 0
                end
            end
        
            for i, key in ipairs(KEYS) do
                redis.call('decrby', key, ARGV[i])
            end
            return 1
        `;

    const result = await redis.eval(
      luaScript,
      redisKeys.length,
      ...redisKeys,
      ...redisArgs
    );

    if (result === 0) {
      throw new Error("One or more tickets are sold out!");
    }

    try {
      return await AppDataSource.manager.transaction(
        async (transactionalEntityManager) => {
          const user = await transactionalEntityManager.findOneBy(User, {
            id: parseInt(payload!.userId),
          });
          if (!user) throw new Error("User not found");

          let totalPrice = 0;
          const orderDetailsToSave: OrderDetail[] = [];

          for (const item of items) {
            await transactionalEntityManager.decrement(Ticket, {
              id: item.ticketId,
            }, "quota", item.qty);

            const ticket = await transactionalEntityManager.findOneBy(Ticket, { id: item.ticketId });

            if (!ticket) throw new Error(`Ticket Invalid`);

            totalPrice += ticket.price * item.qty;

            const detail = new OrderDetail();
            detail.ticket = ticket;
            detail.qty = item.qty;
            orderDetailsToSave.push(detail);
          }

          const order = new Order();
          order.user = user;
          order.total_price = totalPrice;
          const savedOrder = await transactionalEntityManager.save(order);

          for (const detail of orderDetailsToSave) {
            detail.order = savedOrder;
            await transactionalEntityManager.save(detail);
          }

          savedOrder.details = orderDetailsToSave;
          return savedOrder;
        }
      );
    } catch (error) {
      console.error("MySQL Error, Rolling back Redis...", error);

      items.forEach(async (item) => {
        await redis.incrby(`ticket:${item.ticketId}:quota`, item.qty);
      });

      throw new Error("Transaction failed, please try again.");
    }
  }
}
