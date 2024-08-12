import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function ValidOTP(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'validOTP',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return (
            value != undefined &&
            value.toString().length === 6 &&
            !Number.isNaN(Number(value))
          );
        },
        defaultMessage(args: ValidationArguments) {
          return 'OTP Invalid';
        },
      },
    });
  };
}
