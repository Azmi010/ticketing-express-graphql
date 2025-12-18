import { Field, InputType } from "type-graphql";

@InputType()
export class TicketInput {
    @Field()
    name: string;

    @Field()
    price: number;
    
    @Field()
    quota: number;
}