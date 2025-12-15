import { Field, ID, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { OrderDetail } from "./OrderDetail";

@ObjectType()
@Entity("orders")
export class Order extends BaseEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column()
    total_price: number;

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field(() => User)
    @ManyToOne(() => User, user => user.orders)
    user: User;

    @Field(() => [OrderDetail])
    @OneToMany(() => OrderDetail, orderDetail => orderDetail.order)
    details: OrderDetail[];
}