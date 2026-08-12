import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { CustomAlertModal, AlertButton } from './CustomAlertModal';

type AlertListener = (
  title: string,
  message: string,
  buttons?: any[],
  options?: any
) => void;

let alertListener: AlertListener | null = null;

// Override React Native's default Alert.alert
const originalAlert = Alert.alert;

Alert.alert = (title, message, buttons, options) => {
  if (alertListener) {
    alertListener(title || '', message || '', buttons, options);
  } else {
    // Fallback to original native alert if listener is not ready
    originalAlert(title, message, buttons, options);
  }
};

export function CustomAlertProvider() {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [buttons, setButtons] = useState<AlertButton[]>([]);

  useEffect(() => {
    alertListener = (t, m, btns, opts) => {
      setTitle(t);
      setDescription(m);
      
      // Classify type based on keywords in title/message to show correct icon!
      const lowerTitle = t.toLowerCase();
      const lowerMsg = m.toLowerCase();
      if (
        lowerTitle.includes('error') || 
        lowerTitle.includes('invalid') || 
        lowerTitle.includes('fail') ||
        lowerTitle.includes('insufficient') ||
        lowerMsg.includes('error') ||
        lowerMsg.includes('invalid') ||
        lowerMsg.includes('fail') ||
        lowerMsg.includes('missing')
      ) {
        setType('error');
      } else if (
        lowerTitle.includes('alert') || 
        lowerTitle.includes('warning') || 
        lowerTitle.includes('reset') ||
        lowerTitle.includes('delete') ||
        lowerTitle.includes('cancel') ||
        lowerMsg.includes('warning') ||
        lowerMsg.includes('sure')
      ) {
        setType('warning');
      } else if (
        lowerTitle.includes('success') || 
        lowerTitle.includes('logged') || 
        lowerTitle.includes('complete') || 
        lowerTitle.includes('created') ||
        lowerTitle.includes('set') ||
        lowerTitle.includes('active') ||
        lowerTitle.includes('saved') ||
        lowerTitle.includes('sent') ||
        lowerTitle.includes('claim') ||
        lowerTitle.includes('reward') ||
        lowerTitle.includes('daily')
      ) {
        setType('success');
      } else {
        setType('info');
      }

      // Convert React Native button definitions to CustomAlertModal button format!
      if (btns && btns.length > 0) {
        const mapped = btns.map((b) => ({
          text: b.text || 'OK',
          onPress: b.onPress || (() => {}),
          variant: b.style === 'destructive' 
            ? 'destructive' as const 
            : b.style === 'cancel' 
            ? 'secondary' as const 
            : 'primary' as const,
        }));
        setButtons(mapped);
      } else {
        setButtons([]);
      }

      setVisible(true);
    };

    return () => {
      alertListener = null;
    };
  }, []);

  return (
    <CustomAlertModal
      visible={visible}
      type={type}
      title={title}
      description={description}
      buttons={buttons}
      onClose={() => setVisible(false)}
    />
  );
}
