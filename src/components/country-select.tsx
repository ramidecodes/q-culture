"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Country = {
  isoCode: string;
  name: string;
};

type CountrySelectProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  countries: Country[];
  disabled?: boolean;
  placeholder?: string;
};

export function CountrySelect({
  value,
  onValueChange,
  countries,
  disabled = false,
  placeholder = "Select a country",
}: CountrySelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {countries.map((country) => (
          <SelectItem key={country.isoCode} value={country.isoCode}>
            {country.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
