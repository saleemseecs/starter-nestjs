import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('userrole')
export class UserRolesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;
}
