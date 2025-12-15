import { Field, ID, ObjectType } from "type-graphql";
import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "./Role";
import { Event } from "./Event";
import { Order } from "./Order";

@ObjectType()
@Entity("users")
export class User extends BaseEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column()
    name: string;

    @Field()
    @Column()
    email: string;

    @Column()
    password: string;

    @Field()
    @ManyToOne(() => Role, role => role.users)
    role: Role;

    @Field(() => [Event])
    @OneToMany(() => Event, event => event.organizer)
    events: Event[];

    @Field(() => [Order])
    @OneToMany(() => Order, order => order.user)
    orders: Order[];
}