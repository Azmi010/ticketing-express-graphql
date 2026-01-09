import { Arg, Mutation, Query, Resolver, UseMiddleware, Subscription, Root } from "type-graphql";
import { Ticket } from "../entities/Ticket";
import { Event } from "../entities/Event";
import { isAuth } from "../utils/isAuth";
import { isAdmin } from "../utils/isAdmin";
import { TicketInput } from "../types/TicketInput";
import { redis } from "../config/redis";
import { pubsub, TICKET_STOCK_UPDATED } from "../config/pubsub";
import { TicketStockUpdate } from "../types/TicketStockUpdate";

@Resolver()
export class TicketResolver {
    @Query(() => [Ticket])
    @UseMiddleware(isAuth)
    async tickets() {
        return Ticket.find({ relations: ["event"] });
    }

    @Query(() => Ticket)
    @UseMiddleware(isAuth)
    async ticket(@Arg("id") id: number) {
        const ticket = await Ticket.findOne({
            where: { id },
            relations: ["event"],
        });

        if (!ticket) {
            throw new Error("Ticket not found");
        }

        const redisStock = await redis.get(`ticket:${id}:quota`);
        if (redisStock !== null) {
            ticket.quota = parseInt(redisStock);
        }

        return ticket;
    }

    @Subscription(() => TicketStockUpdate, {
        subscribe: () => pubsub.asyncIterableIterator(TICKET_STOCK_UPDATED),
    } as any)
    ticketStockUpdated(@Root() payload: TicketStockUpdate): TicketStockUpdate {
        return payload;
    }

    @Subscription(() => TicketStockUpdate, {
        subscribe: () => pubsub.asyncIterableIterator(TICKET_STOCK_UPDATED),
        filter: (payload: any) => {
            return payload.payload.ticketId === payload.args.ticketId;
        },
    } as any)
    ticketStockUpdatedById(
        @Root() payload: TicketStockUpdate,
        @Arg("ticketId") ticketId: number
    ): TicketStockUpdate {
        return payload;
    }

    @Subscription(() => TicketStockUpdate, {
        subscribe: () => pubsub.asyncIterableIterator(TICKET_STOCK_UPDATED),
        filter: (payload: any) => {
            return payload.payload.eventId === payload.args.eventId;
        },
    } as any)
    ticketStockUpdatedByEvent(
        @Root() payload: TicketStockUpdate,
        @Arg("eventId") eventId: number
    ): TicketStockUpdate {
        return payload;
    }

    @Mutation(() => Ticket)
    @UseMiddleware(isAuth, isAdmin)
    async createTicket(
        @Arg("eventId") eventId: number,
        @Arg("data") data: TicketInput
    ) {
        const event = await Event.findOneBy({ id : eventId });
        if (!event) {
            throw new Error("Event not found");
        }

        const ticket = Ticket.create({
            name: data.name,
            price: data.price,
            quota: data.quota,
            event: event,
        })
        
        await ticket.save();
        await redis.set(`ticket:${ticket.id}:quota`, ticket.quota);
        return ticket;
    }

    @Mutation(() => Ticket)
    @UseMiddleware(isAuth, isAdmin)
    async updateTicket(@Arg("id") id: number, @Arg("data") data: TicketInput) {
        const ticket = await Ticket.findOne({
            where: { id },
            relations: ["event"],
        });
        if (!ticket) {
            throw new Error("Ticket not found");
        }

        const previousStock = ticket.quota;

        ticket.name = data.name;
        ticket.price = data.price;
        ticket.quota = data.quota;

        await ticket.save();
        await redis.set(`ticket:${ticket.id}:quota`, ticket.quota);

        const updatePayload: TicketStockUpdate = {
            ticketId: ticket.id,
            ticketName: ticket.name,
            eventId: ticket.event.id,
            eventTitle: ticket.event.title,
            remainingStock: ticket.quota,
            previousStock: previousStock,
            updatedAt: new Date(),
        };

        await pubsub.publish(TICKET_STOCK_UPDATED, updatePayload);

        return ticket;
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth, isAdmin)
    async deleteTicket(@Arg("id") id: number) {
        const ticket = await Ticket.findOneBy({ id });
        if (!ticket) {
            throw new Error("Ticket not found");
        }

        await ticket.remove();
        await redis.del(`ticket:${id}:quota`);
        return true;
    }
}