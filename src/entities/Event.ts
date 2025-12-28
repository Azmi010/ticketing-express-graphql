import { Field, ID, ObjectType } from "type-graphql";
import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { EventCategory } from "./EventCategory";
import { Ticket } from "./Ticket";

@ObjectType()
@Entity("events")
export class Event extends BaseEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column()
    title: string;

    @Field()
    @Column()
    description: string;

    @Field()
    @Column()
    location: string;

    @Field()
    @Column()
    date: Date;

    @Field()
    @ManyToOne(() => User, user => user.events)
    organizer: User;

    @Field()
    @ManyToOne(() => EventCategory, category => category.events)
    category: EventCategory;

    @Field(() => [Ticket])
    @OneToMany(() => Ticket, ticket => ticket.event)
    tickets: Ticket[];
}