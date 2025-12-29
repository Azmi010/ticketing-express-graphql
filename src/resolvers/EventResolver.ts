import { Arg, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { Event } from "../entities/Event";
import { EventInput } from "../types/EventInput";
import { EventCategory } from "../entities/EventCategory";
import { User } from "../entities/User";
import { isAuth } from "../utils/isAuth";
import { isAdmin } from "../utils/isAdmin";
import { EventSearchService } from "../services/EventSearchService";
import { SearchEventInput } from "../types/SearchEventInput";
import { SearchEventResponse } from "../types/SearchEventResponse";

const searchService = new EventSearchService();

@Resolver()
export class EventResolver {
  @Query(() => [Event])
  @UseMiddleware(isAuth)
  async events() {
    return Event.find({ relations: ["category"] });
  }

  @Query(() => Event)
  @UseMiddleware(isAuth)
  async event(@Arg("id") id: number) {
    return Event.findOne({
      where: { id },
      relations: ["category", "organizer", "tickets"],
    });
  }

  @Query(() => [SearchEventResponse])
  @UseMiddleware(isAuth)
  async searchEvents(@Arg("input") input: SearchEventInput) {
    return await searchService.searchEvent(input);
  }

  @Mutation(() => Event)
  @UseMiddleware(isAuth, isAdmin)
  async createEvent(@Arg("data") data: EventInput) {
    const event = await Event.create({
      title: data.title,
      description: data.description,
      location: data.location,
      date: data.date,
      category: (await EventCategory.findOneBy({
        id: data.categoryId,
      })) as EventCategory,
      organizer: (await User.findOneBy({ id: data.organizerId })) as User,
    }).save();

    const eventWithRelations = await Event.findOne({
      where: { id: event.id },
      relations: ["category", "organizer"],
    });

    if (eventWithRelations) {
      await searchService.indexEvent(eventWithRelations);
    }

    return event;
  }

  @Mutation(() => Event)
  @UseMiddleware(isAuth, isAdmin)
  async updateEvent(@Arg("id") id: number, @Arg("data") data: EventInput) {
    const event = await Event.findOneBy({ id });
    if (!event) {
      throw new Error("Event not found");
    }

    event.title = data.title;
    event.description = data.description;
    event.location = data.location;
    event.date = data.date;
    event.category = (await EventCategory.findOneBy({
      id: data.categoryId,
    })) as EventCategory;
    event.organizer = (await User.findOneBy({ id: data.organizerId })) as User;

    await event.save();

    const eventWithRelations = await Event.findOne({
      where: { id: event.id },
      relations: ["category", "organizer"],
    });

    if (eventWithRelations) {
      await searchService.indexEvent(eventWithRelations);
    }

    return event;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth, isAdmin)
  async deleteEvent(@Arg("id") id: number) {
    const event = await Event.findOneBy({ id });
    if (!event) {
      throw new Error("Event not found");
    }

    await event.remove();
    await searchService.removeEvent(id);
    return true;
  }
}
