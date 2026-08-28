import { motion, type HTMLMotionProps } from 'framer-motion';

import { cn } from '@/utils/cn';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-gray-100 dark:bg-slate-800', className)} {...props} />;
}

const Animated: React.FC<HTMLMotionProps<'div'>> = ({ className, ...props }) => (
  <motion.div
    className={cn('rounded-md bg-gray-100 dark:bg-slate-800', className)}
    animate={{ opacity: [1, 0.5, 1] }}
    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    {...props}
  />
);

Skeleton.Animated = Animated;

export { Skeleton };
