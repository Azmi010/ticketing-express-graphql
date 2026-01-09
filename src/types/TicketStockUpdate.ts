import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
export class TicketStockUpdate {
  @Field(() => ID)
  ticketId: number;

  @Field()
  ticketName: string;

  @Field()
  eventId: number;

  @Field()
  eventTitle: string;

  @Field()
  remainingStock: number;

  @Field()
  previousStock: number;

  @Field()
  updatedAt: Date;
}
