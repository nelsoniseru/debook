import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { NotificationsService } from '../notifications/notifications.service';

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
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private consumer: Consumer;

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {
    const clientId = this.configService.get('KAFKA_CLIENT_ID', 'debook-notification-service');
    const brokers = [this.configService.get('KAFKA_BROKERS', 'kafka:9092')];
    const groupId = this.configService.get('KAFKA_GROUP_ID', 'debook-notification-group');
    
    this.logger.log(`Initializing Kafka consumer with clientId: ${clientId}, brokers: ${brokers.join(',')}, groupId: ${groupId}`);
    
    const kafka = new Kafka({
      clientId: clientId,
      brokers: brokers, 
    });

    this.consumer = kafka.consumer({ 
      groupId: groupId 
    });
  }

  async onModuleInit() {
    this.logger.log('Starting Kafka consumer initialization...');
    
    const maxRetries = 10;
    const retryDelay = 5000; 
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        this.logger.log(`Attempt ${i + 1}/${maxRetries} to connect to Kafka...`);
        
        await this.consumer.connect();
        this.logger.log('Connected to Kafka successfully');
        
        const topic = this.configService.get('KAFKA_INTERACTION_TOPIC', 'interaction.created');
        this.logger.log(`Subscribing to topic: ${topic}`);
        
        await this.consumer.subscribe({ topic, fromBeginning: false });
        this.logger.log(`Subscribed to topic: ${topic}`);
        
        await this.consumer.run({
          eachMessage: async (payload: EachMessagePayload) => {
            this.logger.debug('Received Kafka message');
            await this.processMessage(payload);
          },
        });
        
        this.logger.log('Kafka consumer running successfully');
        break; 
        
      } catch (error) {
        this.logger.error(`Attempt ${i + 1} failed: ${error.message}`);
        
        if (i === maxRetries - 1) {
          this.logger.error('Max retries reached. Kafka consumer failed to start.');
          return;
        }
        
        this.logger.log(`Waiting ${retryDelay / 1000} seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting Kafka consumer...');
    try {
      await this.consumer.disconnect();
      this.logger.log('Kafka consumer disconnected successfully');
    } catch (error) {
      this.logger.error('Error disconnecting Kafka consumer:', error);
    }
  }

  private async processMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;
    const messageKey = message.key?.toString() || 'no-key';
    
    this.logger.debug(`Processing message from topic ${topic}, partition ${partition}, key: ${messageKey}`);
    
    try {
      const messageValue = payload.message.value?.toString();
      if (!messageValue) {
        this.logger.warn(`Empty message value from topic ${topic}, partition ${partition}`);
        return;
      }

      const event: InteractionEvent = JSON.parse(messageValue);
      this.logger.log(`Processing interaction event: ${event.type} on post ${event.postId} for owner ${event.ownerId}`);
      this.logger.debug(`Event details: ${JSON.stringify({
        id: event.id,
        type: event.type,
        ownerId: event.ownerId,
        actorId: event.actorId,
        postId: event.postId,
        contentLength: event.content?.length || 0
      })}`);

      const notification = await this.notificationsService.createNotification(event);
      this.logger.log(`Notification created successfully: ${notification.id}`);
      this.logger.debug(`Notification details: ${JSON.stringify({
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        status: notification.status
      })}`);

      this.logger.debug('Event processing completed successfully');

    } catch (error) {
      this.logger.error(`Error processing Kafka message from topic ${topic}, partition ${partition}:`, error);
      this.logger.error(`Message key: ${messageKey}, offset: ${message.offset}`);
    }
  }
}