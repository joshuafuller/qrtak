module.exports = {
  toCanvas: jest.fn().mockImplementation(() => {
    const canvas = document.createElement('canvas');
    return Promise.resolve(canvas);
  }),
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mock-qr-code')
};
