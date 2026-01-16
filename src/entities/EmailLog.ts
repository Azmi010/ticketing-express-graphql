import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Order } from "./Order";
import { ManyToOne } from "typeorm";

export type EmailStatus = "PENDING" | "SENT" | "FAILED";

@Entity("email_logs")
export class EmailLog extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  to: string;

  @Column()
  subject: string;

  @Column({
    type: "enum",
    enum: ["PENDING", "SENT", "FAILED"],
    default: "PENDING",
  })
  status: EmailStatus;

  @Column({ nullable: true })
  error?: string;

  @ManyToOne(() => Order)
  order: Order;

  @CreateDateColumn()
  createdAt: Date;
}
