import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Role } from '../enums/role.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    nullable:true
  })
  app: string;

  @Column({
    nullable:true
  })
  username: string;

  @Column({
    nullable:true
  })
  password: string;

  @Column({
    nullable:true
  })
  firstName: string;

  @Column({
    nullable:true
  })
  lastName: string;

  @Column({
    nullable:true
  })
  currentStatus: string;

  @Column({
    nullable:true
  })
  msisdn: string;

  @Column({
    nullable:true
  })
  simStatus: string;

  @Column({
    nullable:true
  })
  generation: string;


  @Column({
    nullable:true
  })
  device: string;

  @Column({
    nullable:true
  })
  email: string;

  // @Column()
  // role: number;

  @Column({
    nullable:true
  })
  cookieToken: string;

  @Column({
    nullable:true
  })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    nullable: true,
  })
  lastModified: Date;

  @Column({
    nullable:true
  })
  deleted_at: Date;

  @Column({ default: true })
  isActive: boolean;
}
