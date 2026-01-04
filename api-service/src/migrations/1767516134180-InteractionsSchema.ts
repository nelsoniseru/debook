import { MigrationInterface, QueryRunner, Table, TableIndex, TableUnique } from "typeorm";

export class InteractionsSchema1767516134180 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<void> {
          // Create interactions table
          await queryRunner.createTable(new Table({
              name: 'interactions',
              columns: [
                  {
                      name: 'id',
                      type: 'uuid',
                      isPrimary: true,
                      generationStrategy: 'uuid',
                      default: 'uuid_generate_v4()',
                  },
                  {
                      name: 'userId',
                      type: 'uuid',
                      isNullable: false,
                  },
                  {
                      name: 'postId',
                      type: 'uuid',
                      isNullable: false,
                  },
                  {
                      name: 'type',
                      type: 'enum',
                      enum: ['like', 'comment'],
                      default: "'like'",
                  },
                  {
                      name: 'content',
                      type: 'text',
                      isNullable: true,
                  },
                  {
                      name: 'createdAt',
                      type: 'timestamp',
                      default: 'now()',
                  },
              ],
          }));
  
          // Add foreign key constraint (posts table must exist first)
            await queryRunner.query(`
              ALTER TABLE interactions 
              ADD CONSTRAINT FK_interactions_post 
              FOREIGN KEY ("postId") 
              REFERENCES posts(id) 
              ON DELETE CASCADE
          `);
  
  
          // Create unique constraint to prevent duplicate interactions
          await queryRunner.createUniqueConstraint('interactions', new TableUnique({
              name: 'UNQ_interactions_user_post_type',
              columnNames: ['userId', 'postId', 'type'],
          }));
  
          // Create indexes for interactions table
          await queryRunner.createIndex('interactions', new TableIndex({
              name: 'IDX_interactions_post_type',
              columnNames: ['postId', 'type'],
          }));
  
          await queryRunner.createIndex('interactions', new TableIndex({
              name: 'IDX_interactions_user_post',
              columnNames: ['userId', 'postId'],
          }));
  
          await queryRunner.createIndex('interactions', new TableIndex({
              name: 'IDX_interactions_created_at',
              columnNames: ['createdAt'],
          }));
      }
  
      public async down(queryRunner: QueryRunner): Promise<void> {
          await queryRunner.dropTable('interactions');
      }

}
