export enum StatusEnum {
  SEARCHING = 'SEARCHING', // Finding a shoemaker
  ACCEPTED = 'ACCEPTED', // Found a shoemaker
  MEETING = 'MEETING',
  INPROGRESS = 'INPROGRESS', // Shoemaker is working on the shoe
  COMPLETED = 'COMPLETED', // Trip is completed
  SHOEMAKER_CANCEL = 'SHOEMAKER_CANCEL', // Shoemaker canceled the trip after accepting
  CUSTOMER_CANCEL = 'CUSTOMER_CANCEL', // Customer canceled the trip
}

export enum PartialStatusEnum {
  MEETING = StatusEnum.MEETING,
  INPROGRESS = StatusEnum.INPROGRESS,
  COMPLETED = StatusEnum.COMPLETED,
}

export enum ShoemakerStatusEnum {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
}
