import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { CustomAlertModal, AlertButton, CustomAlertType } from './CustomAlertModal';

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
  const [type, setType] = useState<CustomAlertType>('info');
  const [buttons, setButtons] = useState<AlertButton[]>([]);

  useEffect(() => {
    alertListener = (t, m, btns, opts) => {
      setTitle(t);
      setDescription(m);
      
      const lowerTitle = (t || '').toLowerCase();
      const lowerMsg = (m || '').toLowerCase();

      // Smart fintech alert classification
      if (
        lowerTitle.includes('sign out') ||
        lowerTitle.includes('log out') ||
        lowerMsg.includes('sign out') ||
        lowerMsg.includes('log out')
      ) {
        setType('logout');
      } else if (
        lowerTitle.includes('delete') ||
        lowerTitle.includes('remove') ||
        lowerMsg.includes('delete') ||
        lowerMsg.includes('discard')
      ) {
        setType('delete');
      } else if (
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
        lowerTitle.includes('success') || 
        lowerTitle.includes('updated') ||
        lowerTitle.includes('update') ||
        lowerTitle.includes('logged') || 
        lowerTitle.includes('complete') || 
        lowerTitle.includes('created') ||
        lowerTitle.includes('set') ||
        lowerTitle.includes('active') ||
        lowerTitle.includes('saved') ||
        lowerTitle.includes('save') ||
        lowerTitle.includes('sent') ||
        lowerTitle.includes('claim') ||
        lowerTitle.includes('reward') ||
        lowerTitle.includes('daily') ||
        lowerMsg.includes('success') ||
        lowerMsg.includes('updated') ||
        lowerMsg.includes('successfully')
      ) {
        setType('success');
      } else if (
        lowerTitle.includes('alert') || 
        lowerTitle.includes('warning') || 
        lowerTitle.includes('reset') ||
        lowerTitle.includes('cancel') ||
        lowerMsg.includes('warning') ||
        lowerMsg.includes('sure') ||
        lowerMsg.includes('caution')
      ) {
        setType('warning');
      } else {
        setType('info');
      }

      // Convert React Native button definitions to CustomAlertModal button format with smart variant inference
      if (btns && btns.length > 0) {
        const mapped: AlertButton[] = btns.map((b) => {
          const btnText = b.text || 'OK';
          const isDestructive =
            b.style === 'destructive' ||
            /delete|sign out|log out|remove|discard/i.test(btnText);
          const isCancel =
            b.style === 'cancel' ||
            /cancel|dismiss|close|not now|no/i.test(btnText);

          return {
            text: btnText,
            onPress: b.onPress || (() => {}),
            variant: isDestructive
              ? 'destructive'
              : isCancel
              ? 'secondary'
              : 'primary',
          };
        });
        setButtons(mapped);
      } else {
        setButtons([{ text: 'OK', onPress: () => {}, variant: 'primary' }]);
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
