import { Field, InputType, Int } from "type-graphql";

@InputType()
export class OrderInput {
    @Field(() => Int)
    ticketId: number;

    @Field(() => Int)
    qty: number;
}