import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class PostsSchema1767516081693 implements MigrationInterface {

 public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable UUID extension
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Create posts table
        await queryRunner.createTable(new Table({
            name: 'posts',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    generationStrategy: 'uuid',
                    default: 'uuid_generate_v4()',
                },
                {
                    name: 'content',
                    type: 'text',
                    isNullable: false,
                },
                {
                    name: 'authorId',
                    type: 'uuid',
                    isNullable: false,
                },
                {
                    name: 'likesCount',
                    type: 'integer',
                    default: 0,
                },
                {
                    name: 'commentsCount',
                    type: 'integer',
                    default: 0,
                },
                {
                    name: 'createdAt',
                    type: 'timestamp',
                    default: 'now()',
                },
                {
                    name: 'updatedAt',
                    type: 'timestamp',
                    default: 'now()',
                },
            ],
        }));

        // Create indexes for posts table
        await queryRunner.createIndex('posts', new TableIndex({
            name: 'IDX_posts_author_id',
            columnNames: ['authorId'],
        }));

        await queryRunner.createIndex('posts', new TableIndex({
            name: 'IDX_posts_likes_count',
            columnNames: ['likesCount'],
        }));

        await queryRunner.createIndex('posts', new TableIndex({
            name: 'IDX_posts_comments_count',
            columnNames: ['commentsCount'],
        }));

        await queryRunner.createIndex('posts', new TableIndex({
            name: 'IDX_posts_created_at',
            columnNames: ['createdAt'],
        }));

        await queryRunner.createIndex('posts', new TableIndex({
            name: 'IDX_posts_updated_at',
            columnNames: ['updatedAt'],
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('posts');
    }

}
