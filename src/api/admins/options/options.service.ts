import { OPTIONS } from '@common/constants';
import { Option } from '@entities/option.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOptionDto } from './dto/create-option.dto';

@Injectable()
export class OptionService {
  constructor(
    @InjectRepository(Option)
    private readonly optionRepository: Repository<Option>,
  ) {}

  /**
   * Function to create option
   * @param createOptionDto CreateOptionDto
   * @returns Promise<Option>
   */
  async create(dto: CreateOptionDto) {
    try {
      const option = await this.optionRepository.findOneBy({
        key: OPTIONS.STRINGEE_NUMBER,
      });
      const option1 = new Option();
      option1.key = OPTIONS.STRINGEE_NUMBER;
      option1.value = dto.phone;
      if (option) {
        option1.id = option.id;
      }
      return await this.optionRepository.save(option1);
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  /**
   * Function to get option
   * @param key string
   * @returns Promise<Option>
   */
  async get() {
    try {
      return await this.optionRepository.findOneBy({
        key: OPTIONS.STRINGEE_NUMBER,
      });
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }
}
