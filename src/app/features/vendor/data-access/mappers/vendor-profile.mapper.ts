import { IVendorProfileResponseDto, IVendorWorkshopAddressDto } from '../dto/vendor-profile-response.dto';
import { IVendorProfileRequestDto, IVendorWorkshopAddressRequestDto } from '../dto/vendor-profile-request.dto';
import { IVendorProfile, IVendorWorkshopAddress } from '../../interfaces/iworkshop-profile';

export function mapVendorProfileResponseDto(dto: IVendorProfileResponseDto): IVendorProfile {
  return {
    fullName: dto.fullName ?? null,
    phoneNumber: dto.phoneNumber ?? null,
    email: dto.email ?? null,
    preferredLanguage: dto.preferredLanguage ?? 'en',
    workshopNameAr: dto.workshopNameAr ?? null,
    workshopNameEn: dto.workshopNameEn ?? null,
    descriptionAr: dto.descriptionAr ?? null,
    descriptionEn: dto.descriptionEn ?? null,
    workshopAddress: mapWorkshopAddress(dto.workshopAddress),
    logoUrl: dto.logoUrl ?? null,
  };
}

function mapWorkshopAddress(dto: IVendorWorkshopAddressDto | null | undefined): IVendorWorkshopAddress {
  return {
    city: dto?.city ?? null,
    area: dto?.area ?? null,
    street: dto?.street ?? null,
    buildingNumber: dto?.buildingNumber ?? null,
    notes: dto?.notes ?? null,
  };
}

export function mapVendorProfileUpdateRequest(profile: IVendorProfile): IVendorProfileRequestDto {
  return {
    fullName: toNullWhenEmpty(profile.fullName),
    phoneNumber: toNullWhenEmpty(profile.phoneNumber),
    email: toNullWhenEmpty(profile.email),
    preferredLanguage: profile.preferredLanguage || 'en',
    workshopNameAr: toNullWhenEmpty(profile.workshopNameAr),
    workshopNameEn: toNullWhenEmpty(profile.workshopNameEn),
    descriptionAr: toNullWhenEmpty(profile.descriptionAr),
    descriptionEn: toNullWhenEmpty(profile.descriptionEn),
    workshopAddress: mapAddressRequest(profile.workshopAddress),
  };
}

function mapAddressRequest(address: IVendorWorkshopAddress | null | undefined): IVendorWorkshopAddressRequestDto {
  return {
    city: toNullWhenEmpty(address?.city),
    area: toNullWhenEmpty(address?.area),
    street: toNullWhenEmpty(address?.street),
    buildingNumber: toNullWhenEmpty(address?.buildingNumber),
    notes: toNullWhenEmpty(address?.notes),
  };
}

function toNullWhenEmpty(value: string | null | undefined): string | null {
  if (value === undefined || value === null || value.trim() === '') {
    return null;
  }
  return value;
}
