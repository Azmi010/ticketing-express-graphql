import { Field, InputType, Int } from "type-graphql";

@InputType()
export class SearchEventInput {
    @Field({ nullable: true })
    keyword?: string;

    @Field({ nullable: true })
    location?: string;

    @Field(() => Int, { nullable: true })
    categoryId?: number;

    @Field({ nullable: true })
    startDate?: Date;
    
    @Field({ nullable: true })
    endDate?: Date;
}