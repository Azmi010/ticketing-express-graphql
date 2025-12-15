import { Field, InputType, Int } from "type-graphql";

@InputType()
export class EventInput {
    @Field()
    title:string;

    @Field()
    description:string;

    @Field()
    date:Date;

    @Field(() => Int)
    categoryId:number;

    @Field(() => Int)
    organizerId:number;
}