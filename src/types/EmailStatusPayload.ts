import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class EmailStatusPayload {
  @Field()
  emailLogId: number;

  @Field()
  orderId: number;

  @Field()
  status: string;

  @Field({ nullable: true })
  error?: string;

  @Field()
  updatedAt: Date;
}