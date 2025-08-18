import dynamic from 'next/dynamic';

const ConfirmModal = dynamic(() => import('../ConfirmModal'), {
  loading: () => null,
});

export default ConfirmModal;