import { Arg, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { Ticket } from "../entities/Ticket";
import { Event } from "../entities/Event";
import { isAuth } from "../utils/isAuth";
import { isAdmin } from "../utils/isAdmin";
import { TicketInput } from "../types/TicketInput";

@Resolver()
export class TicketResolver {
    @Query(() => [Ticket])
    @UseMiddleware(isAuth)
    async tickets() {
        return Ticket.find({ relations: ["event"] });
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
        return ticket;
    }

    @Mutation(() => Ticket)
    @UseMiddleware(isAuth, isAdmin)
    async updateTicket(@Arg("id") id: number, @Arg("data") data: TicketInput) {
        const ticket = await Ticket.findOneBy({ id });
        if (!ticket) {
            throw new Error("Ticket not found");
        }

        ticket.name = data.name;
        ticket.price = data.price;
        ticket.quota = data.quota;

        await ticket.save();
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
        return true;
    }
}