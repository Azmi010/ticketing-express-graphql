import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
export class SearchEventResponse {
  @Field(() => ID)
  id: number;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  location: string;

  @Field()
  date: Date;

  @Field({ nullable: true })
  categoryName: string;

  @Field({ nullable: true })
  organizerName: string;
}
