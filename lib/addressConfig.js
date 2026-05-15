import { Home, Briefcase, MapPin } from 'lucide-react';

export const ADDRESS_LABEL_ICONS = {
  home: Home,
  work: Briefcase,
  other: MapPin,
};

export const ADDRESS_LABEL_OPTIONS = [
  { value: 'home', label: 'Home' },
  { value: 'work', label: 'Work' },
  { value: 'other', label: 'Other' },
];

export function getAddressIcon(label) {
  return ADDRESS_LABEL_ICONS[label] || MapPin;
}
