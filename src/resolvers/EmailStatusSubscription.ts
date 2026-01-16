import { Arg, Root, Subscription, Field, ObjectType } from "type-graphql";

export const EMAIL_STATUS_UPDATED = "EMAIL_STATUS_UPDATED";

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

export class EmailStatusSubscription {
  @Subscription(() => EmailStatusPayload, {
    topics: EMAIL_STATUS_UPDATED,
    filter: ({ payload, args }: { payload: EmailStatusPayload; args: { orderId: number } }) => {
      return payload.orderId === args.orderId;
    },
  })
  emailStatusUpdated(
    @Root() payload: EmailStatusPayload,
    @Arg("orderId") orderId: number
  ): EmailStatusPayload {
    return payload;
  }
}
