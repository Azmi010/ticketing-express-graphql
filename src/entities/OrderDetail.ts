import { Field, ID, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";
import { Order } from "./Order";
import { Ticket } from "./Ticket";

@ObjectType()
@Entity("order_details")
export class OrderDetail extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  qty: number;

  @Field(() => Order)
  @ManyToOne(() => Order, (order) => order.details)
  order: Order;

  @Field(() => Ticket)
  @ManyToOne(() => Ticket)
  ticket: Ticket;
}
