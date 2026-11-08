import { type IconProps } from './Icon';
import { Icon } from './Icon';

export function FolderIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 8 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </Icon>
  );
}

export default FolderIcon;
