import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function phoneValidator(): ValidatorFn {
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    const isValid = phoneRegex.test(control.value);
    return isValid ? null : { invalidPhone: true };
  };
}
