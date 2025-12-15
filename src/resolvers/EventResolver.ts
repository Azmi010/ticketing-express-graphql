import { Arg, Mutation, Query, Resolver } from "type-graphql";
import { Event } from "../entities/Event";
import { EventInput } from "../types/EventInput";
import { EventCategory } from "../entities/EventCategory";
import { User } from "../entities/User";

@Resolver()
export class EventResolver {
    @Query(() => [Event])
    async events() {
        return Event.find({ relations: ["category", "organizer", "tickets"] });
    }

    @Mutation(() => Event)
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
}