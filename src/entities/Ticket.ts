import { Field, ID, ObjectType } from "type-graphql";
import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Event } from "./Event";

@ObjectType()
@Entity("tickets")
export class Ticket extends BaseEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column()
    name: string;

    @Field()
    @Column()
    price: number;

    @Field()
    @Column()
    quota: number;

    @Field(() => Event)
    @ManyToOne(() => Event, event => event.tickets)
    event: Event;
}