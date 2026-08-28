import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

import { cn } from '@utils/cn';

import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  showHeader?: boolean;
  className?: string;
  contentClassName?: string;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  scrollable?: boolean;
}

// https://medium.com/@dlrnjstjs/building-the-perfect-react-modal-from-portals-to-accessibility-a567006ae169

export const Modal: React.FC<ModalProps> = React.memo(
  ({
    isOpen,
    onClose,
    children,
    title,
    description,
    className = 'max-w-2xl',
    contentClassName,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    showHeader = true,
    scrollable = false,
  }) => {
    const modalRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (!isOpen || !closeOnEscape) return;
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.stopImmediatePropagation();
          onClose();
        }
      };
      window.addEventListener('keydown', handler, { capture: true });
      return () => window.removeEventListener('keydown', handler, { capture: true });
    }, [isOpen, closeOnEscape, onClose]);

    useLockBodyScroll(isOpen);
    useFocusTrap(modalRef, isOpen);

    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              data-testid="modal-backdrop"
              className="fixed inset-0 flex items-center justify-center bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                if (closeOnOverlayClick) onClose();
              }}
            />

            <motion.div
              ref={modalRef}
              className={cn('relative max-h-[80vh] w-full max-w-2xl rounded-lg bg-white shadow-xl', { 'overflow-y-auto': scrollable }, className)}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? 'modal-title' : undefined}
              tabIndex={-1}
            >
              <button aria-label="Close modal" type="button" onClick={onClose} className="text-slate-500 hover:text-slate-600 absolute top-4 right-4 transition-colors">
                <X size={24} />
              </button>

              {showHeader && (
                <div className="border-slate-200 flex items-center justify-between border-b p-5">
                  <h2 className="text-slate-800 text-xl font-bold" id="modal-title">{title}</h2>
                  <p className='mt-1 text-sm text-slate-500'>{description}</p>
                  <div onClick={onClose} className="size-6 rounded-full p-1 transition-colors"></div>
                </div>
              )}

              <div className={cn('p-6', contentClassName)}>{children}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  },
);
