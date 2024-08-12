import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function ValidCustomerAddress(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'validCustomerAddress',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const regex = /^-?\d+,-?\d+,.+$/;
          if (value == undefined && !regex.test(value.toString().trim()))
            return false;
          let val = value.toString().split(',', 3);
          let [district_id, provine_id] = [Number(val[1]), Number(val[0])];
          if (
            isNaN(district_id) ||
            isNaN(provine_id) ||
            district_id > 2000 ||
            district_id < 0 ||
            provine_id < 1 ||
            provine_id > 64
          )
            return false;
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return 'address Invalid';
        },
      },
    });
  };
}
