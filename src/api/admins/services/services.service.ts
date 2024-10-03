import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Service } from '@entities/index';
import { CreateServiceDto } from './dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service) private readonly serviceRep: Repository<Service>,
  ) {}

  /**
   * Function to create a new service
   * @param createServiceDto CreateServiceDto
   * @returns Promise<Service>
   */
  async create(dto: CreateServiceDto): Promise<Service> {
    try {
      const service = await this.serviceRep.findOneBy({ name: dto.name });
      if (service) {
        throw new Error('Service already exists');
      }
      return this.serviceRep.save(dto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
