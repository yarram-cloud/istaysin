'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import { Button } from './button';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = false
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-md pointer-events-auto border border-surface-200"
            >
              <div className="p-6 border-b border-surface-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-primary-100 text-primary-600'}`}>
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-surface-900 font-display">{title}</h3>
                </div>
                <button onClick={onCancel} className="text-surface-400 hover:text-surface-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-surface-600 leading-relaxed whitespace-pre-line">{message}</p>
                <div className="mt-8 flex items-center justify-end space-x-3">
                  <Button variant="outline" onClick={onCancel}>{cancelText}</Button>
                  <Button 
                    variant="default" 
                    className={isDestructive ? '!bg-red-600 !hover:bg-red-700 !ring-red-600 text-white' : ''}
                    onClick={() => {
                      onConfirm();
                    }}
                  >
                    {confirmText}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
