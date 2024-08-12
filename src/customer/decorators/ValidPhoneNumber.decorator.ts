import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function ValidPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'validPhoneNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const regexPhoneNumber = /(84|0[3|5|7|8|9])+([0-9]{8})\b/g;
          return (
            value != undefined &&
            value.toString().trim().length === 10 &&
            regexPhoneNumber.test(value.toString().trim())
          );
        },
        defaultMessage(args: ValidationArguments) {
          return 'phone_number Invalid';
        },
      },
    });
  };
}
