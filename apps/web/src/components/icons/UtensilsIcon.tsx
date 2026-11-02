import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function UtensilsIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" /><path d="M15 11v11" /><path d="M5 2v8a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V2" /><path d="M7 12v10" />
    </Icon>
  );
}

export default UtensilsIcon;
