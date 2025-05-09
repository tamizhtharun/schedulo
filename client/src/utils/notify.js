import { message } from 'antd';

/**
 * Wrap a promise to always show a notification popup for both success and error.
 * @param {Promise} promise - The async operation (e.g., axios/fetch)
 * @param {Object} opts - { success: string, error: string }
 * @returns {Promise}
 */
export default function notify(promise, { success = 'Success', error = 'Something went wrong' }) {
  return promise
    .then((res) => {
      message.success(success, 3);
      return res;
    })
    .catch((err) => {
      message.error(
        err?.response?.data?.error || err?.message || error,
        5
      );
      throw err;
    });
}
