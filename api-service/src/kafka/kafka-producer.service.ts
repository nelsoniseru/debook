import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, ProducerRecord } from 'kafkajs';

export interface InteractionEvent {
  id: string;
  ownerId: string,
  actorId:string,
  postId: string;
  type: string;
  content?: string;
  createdAt: Date;
}

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private producer: Producer;

  constructor(private readonly configService: ConfigService) {
    const clientId = this.configService.get('KAFKA_CLIENT_ID', 'debook-api');
    const brokers = this.configService.get('KAFKA_BROKERS', 'localhost:9093').split(',');
    
    this.logger.log(`Initializing Kafka producer with clientId: ${clientId}, brokers: ${brokers.join(',')}`);
    
    const kafka = new Kafka({
      clientId: clientId,
      brokers: brokers,
    });

    this.producer = kafka.producer();
  }

  async onModuleInit() {
    this.logger.log('Connecting Kafka producer...');
    try {
      await this.producer.connect();
      this.logger.log('Kafka producer connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect Kafka producer:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting Kafka producer...');
    try {
      await this.producer.disconnect();
      this.logger.log('Kafka producer disconnected successfully');
    } catch (error) {
      this.logger.error('Error disconnecting Kafka producer:', error);
    }
  }

  async emitInteractionEvent(event: InteractionEvent): Promise<void> {
    const topic = this.configService.get('KAFKA_INTERACTION_TOPIC', 'interaction.created');
    
    this.logger.log(`Emitting interaction event to topic ${topic}: ${event.type} on post ${event.postId}`);
    this.logger.debug(`Interaction event details: ${JSON.stringify({
      id: event.id,
      ownerId: event.ownerId,
      actorId: event.actorId,
      type: event.type,
      postId: event.postId,
      contentLength: event.content?.length || 0
    })}`);

    const record: ProducerRecord = {
      topic: topic,
      messages: [
        {
          value: JSON.stringify(event),
          key: event.postId,
        },
      ],
    };

    try {
      await this.producer.send(record);
      this.logger.log(`Kafka event emitted successfully: ${event.type} on post ${event.postId}`);
    } catch (error) {
      this.logger.error(`Failed to emit Kafka event for interaction ${event.id}:`, error);
      this.logger.error(`Event details: ${JSON.stringify(event)}`);
      throw error;
    }
  }

  async emitNotificationEvent(notification: any): Promise<void> {
    const topic = this.configService.get('KAFKA_NOTIFICATION_TOPIC', 'notification.created');
    
    this.logger.log(`Emitting notification event to topic ${topic} for user ${notification.userId}`);
    this.logger.debug(`Notification event details: ${JSON.stringify({
      userId: notification.userId,
      type: notification.type,
      notificationId: notification.id
    })}`);

    const record: ProducerRecord = {
      topic: topic,
      messages: [
        {
          value: JSON.stringify(notification),
          key: notification.userId,
        },
      ],
    };

    try {
      await this.producer.send(record);
      this.logger.log(`Notification event emitted successfully for user ${notification.userId}`);
    } catch (error) {
      this.logger.error(`Failed to emit notification event for user ${notification.userId}:`, error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    this.logger.debug('Performing Kafka health check...');
    try {
      await this.producer.send({
        topic: '__health_check',
        messages: [{ value: 'ping' }],
      });
      this.logger.debug('Kafka health check passed');
      return true;
    } catch (error) {
      this.logger.warn('Kafka health check failed:', error);
      return false;
    }
  }
}