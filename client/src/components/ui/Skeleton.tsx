import { motion, type HTMLMotionProps } from 'framer-motion';

import { cn } from '@/utils/cn';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('bg-gray-100 animate-pulse rounded-md', className)} {...props} />;
}

const Animated: React.FC<HTMLMotionProps<'div'>> = ({ className, ...props }) => (
  <motion.div
    className={cn('bg-gray-100 rounded-md', className)}
    animate={{ opacity: [1, 0.5, 1] }}
    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    {...props}
  />
);

Skeleton.Animated = Animated;

export { Skeleton };
