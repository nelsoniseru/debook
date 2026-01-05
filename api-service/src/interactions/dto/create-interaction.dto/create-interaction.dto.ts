import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { InteractionType } from '../../entities/interaction.entity/interaction.entity';

export class CreateInteractionDto {
  @IsEnum(InteractionType)
  type: InteractionType;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  content?: string;
}