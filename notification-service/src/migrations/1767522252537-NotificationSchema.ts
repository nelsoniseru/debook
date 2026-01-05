import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class NotificationSchema1767522252537 implements MigrationInterface {

public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'notifications',
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
                    name: 'actorId',
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
                    isNullable: false,
                },
                {
                    name: 'status',
                    type: 'enum',
                    enum: ['pending', 'sent', 'read'],
                    default: "'pending'",
                },
                {
                    name: 'message',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'metadata',
                    type: 'jsonb',
                    isNullable: true,
                },
                {
                    name: 'createdAt',
                    type: 'timestamp',
                    default: 'now()',
                },
            ],
        }));

        await queryRunner.createIndex('notifications', new TableIndex({
            name: 'IDX_notifications_user_created',
            columnNames: ['userId', 'createdAt'],
        }));

        await queryRunner.createIndex('notifications', new TableIndex({
            name: 'IDX_notifications_status_created',
            columnNames: ['status', 'createdAt'],
        }));

        await queryRunner.createIndex('notifications', new TableIndex({
            name: 'IDX_notifications_post',
            columnNames: ['postId'],
        }));

        await queryRunner.createIndex('notifications', new TableIndex({
            name: 'IDX_notifications_actor',
            columnNames: ['actorId'],
        }));

        await queryRunner.createIndex('notifications', new TableIndex({
            name: 'IDX_notifications_type',
            columnNames: ['type'],
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('notifications');
    }

}
