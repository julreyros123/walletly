import { useToastStore, toast } from '../../src/store/toastStore';

describe('toastStore', () => {
  beforeEach(() => {
    useToastStore.getState().hideToast();
  });

  test('showToast sets currentToast with generated id and default duration', () => {
    useToastStore.getState().showToast({
      type: 'info',
      title: 'Info Title',
      message: 'Info message details',
    });

    const current = useToastStore.getState().currentToast;
    expect(current).not.toBeNull();
    expect(current?.type).toBe('info');
    expect(current?.title).toBe('Info Title');
    expect(current?.message).toBe('Info message details');
    expect(current?.durationMs).toBe(2600);
    expect(typeof current?.id).toBe('string');
  });

  test('showToast custom duration overrides default', () => {
    useToastStore.getState().showToast({
      type: 'warning',
      title: 'Warning Title',
      durationMs: 5000,
    });

    const current = useToastStore.getState().currentToast;
    expect(current?.durationMs).toBe(5000);
  });

  test('hideToast clears currentToast to null', () => {
    useToastStore.getState().showToast({
      type: 'error',
      title: 'Error Title',
    });
    expect(useToastStore.getState().currentToast).not.toBeNull();

    useToastStore.getState().hideToast();
    expect(useToastStore.getState().currentToast).toBeNull();
  });

  test('toast convenience helpers trigger appropriate toast types', () => {
    toast.success('Saved!', 'Budget updated');
    expect(useToastStore.getState().currentToast?.type).toBe('success');
    expect(useToastStore.getState().currentToast?.title).toBe('Saved!');

    toast.info('Note');
    expect(useToastStore.getState().currentToast?.type).toBe('info');

    toast.warning('Careful');
    expect(useToastStore.getState().currentToast?.type).toBe('warning');

    toast.error('Failed');
    expect(useToastStore.getState().currentToast?.type).toBe('error');
  });
});
