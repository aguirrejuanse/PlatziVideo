import gravatar from '../../utils/gravatar';

test('Gravatar Function test', () => {
  const email = 'hola@gmail.com';
  const gravatarUrl = 'https://gravatar.com/avatar/fd9ac7ea15014247f55cbad5141bab55';
  expect(gravatarUrl).toEqual(gravatar(email));
});
