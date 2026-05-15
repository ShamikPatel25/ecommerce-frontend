'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, XCircle, RotateCcw, Package, Loader2, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ACTION_CONFIG = {
  cancel_order: {
    icon: XCircle,
    iconColor: 'text-red-500',
    iconBg: 'bg-red-500/10',
    title: 'Cancel Order',
    subtitle: 'Are you sure you want to cancel this order?',
    description: 'Once cancelled, the order cannot be restored. If payment was made, refund will be initiated within 5-7 business days.',
    warningTitle: 'What happens next:',
    warnings: [
      'Order will be cancelled immediately',
      'Reserved items will be released back to inventory',
      'Refund will be processed to original payment method',
      'You will receive a confirmation email'
    ],
    confirmText: 'Yes, Cancel Order',
    confirmColor: 'bg-red-600 hover:bg-red-700 text-white',
    cancelText: 'Keep Order',
  },
  cancel_item: {
    icon: XCircle,
    iconColor: 'text-red-500',
    iconBg: 'bg-red-500/10',
    title: 'Cancel Item',
    subtitle: 'Are you sure you want to cancel this item?',
    description: 'This item will be removed from your order. Other items in the order will continue to be processed normally.',
    warningTitle: 'Please note:',
    warnings: [
      'Only this item will be cancelled',
      'Other items in your order remain unaffected',
      'Partial refund will be processed for this item',
      'Order total will be adjusted accordingly'
    ],
    confirmText: 'Yes, Cancel Item',
    confirmColor: 'bg-red-600 hover:bg-red-700 text-white',
    cancelText: 'Keep Item',
  },
  return_order: {
    icon: RotateCcw,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    title: 'Request Return',
    subtitle: 'Would you like to return this order?',
    description: 'Your return request will be submitted for review. Our team will contact you within 24-48 hours with pickup details.',
    warningTitle: 'Return process:',
    warnings: [
      'Return request will be submitted',
      'Our team will review and approve the request',
      'Pickup will be scheduled at your convenience',
      'Refund after item inspection (3-5 business days)'
    ],
    confirmText: 'Request Return',
    confirmColor: 'bg-primary hover:bg-primary/90 text-primary-foreground',
    cancelText: 'Keep Order',
  },
  return_item: {
    icon: RotateCcw,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    title: 'Return Item',
    subtitle: 'Would you like to return this item?',
    description: 'Submit a return request for this specific item. Other items in your order will not be affected.',
    warningTitle: 'Return process:',
    warnings: [
      'Only this item will be returned',
      'Other items in your order remain with you',
      'Pickup will be arranged for this item only',
      'Partial refund after item inspection'
    ],
    confirmText: 'Request Return',
    confirmColor: 'bg-primary hover:bg-primary/90 text-primary-foreground',
    cancelText: 'Keep Item',
  },
};

export default function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  actionType = 'cancel_order',
  itemName = null,
  orderNumber = null,
  loading = false,
}) {
  const config = ACTION_CONFIG[actionType] || ACTION_CONFIG.cancel_order;
  const Icon = config.icon;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
              {/* Close button */}
              <button
                onClick={onClose}
                disabled={loading}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header with icon */}
              <div className="pt-8 pb-4 px-6 text-center">
                <div className={`w-16 h-16 rounded-2xl ${config.iconBg} mx-auto mb-4 flex items-center justify-center`}>
                  <Icon className={`w-8 h-8 ${config.iconColor}`} />
                </div>
                <h3 className="text-xl font-black text-foreground mb-1">
                  {config.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {config.subtitle}
                </p>
              </div>

              {/* Content */}
              <div className="px-6 pb-6">
                {/* Item/Order info */}
                {(itemName || orderNumber) && (
                  <div className="mb-4 p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      {itemName && (
                        <p className="font-semibold text-foreground text-sm truncate">{itemName}</p>
                      )}
                      {orderNumber && (
                        <p className="text-xs text-muted-foreground">Order #{orderNumber}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {config.description}
                </p>

                {/* Warnings/Info list */}
                <div className="mb-6 p-4 rounded-xl bg-muted/20 border border-border/50">
                  <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-primary" />
                    {config.warningTitle}
                  </p>
                  <ul className="space-y-2">
                    {config.warnings.map((warning, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 rounded-xl font-bold h-11 border-border hover:border-foreground/20"
                  >
                    {config.cancelText}
                  </Button>
                  <Button
                    onClick={onConfirm}
                    disabled={loading}
                    className={`flex-1 rounded-xl font-bold h-11 ${config.confirmColor}`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      config.confirmText
                    )}
                  </Button>
                </div>

                {/* Additional note */}
                <p className="text-[10px] text-muted-foreground text-center mt-4">
                  Need help? Contact our support team for assistance.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
