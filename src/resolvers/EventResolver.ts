import { Arg, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { Event } from "../entities/Event";
import { EventInput } from "../types/EventInput";
import { EventCategory } from "../entities/EventCategory";
import { User } from "../entities/User";
import { isAuth } from "../utils/isAuth";
import { isAdmin } from "../utils/isAdmin";

@Resolver()
export class EventResolver {
    @Query(() => [Event])
    @UseMiddleware(isAuth)
    async events() {
        return Event.find({ relations: ["category", "organizer", "tickets"] });
    }
    
    @Mutation(() => Event)
    @UseMiddleware(isAuth, isAdmin)
    async createEvent(@Arg("data") data: EventInput) {
        const event = Event.create({
            title: data.title,
            description: data.description,
            date: data.date,
            category: await EventCategory.findOneBy({ id: data.categoryId   }) as EventCategory,
            organizer: await User.findOneBy({ id: data.organizerId   }) as User,
        })

        await event.save();
        return event;
    }

    @Mutation(() => Event)
    @UseMiddleware(isAuth, isAdmin)
    async updateEvent(
        @Arg("id") id: number,
        @Arg("data") data: EventInput
    ) {
        const event = await Event.findOneBy({ id });
        if (!event) {
            throw new Error("Event not found");
        }

        event.title = data.title;
        event.description = data.description;
        event.date = data.date;
        event.category = await EventCategory.findOneBy({ id: data.categoryId   }) as EventCategory;
        event.organizer = await User.findOneBy({ id: data.organizerId   }) as User;

        await event.save();
        return event;
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth, isAdmin)
    async deleteEvent(@Arg("id") id: number) {
        const event = await Event.findOneBy({ id })
        if (!event) {
            throw new Error("Event not found");
        }

        await event.remove();
        return true;
    }
}