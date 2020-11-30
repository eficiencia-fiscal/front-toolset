import {
  formatValueToCurrency,
  generateUUID
} from '../front-toolset'

test('formatValueToCurrency', () => {
  const value = 12.34
  const value_formated = formatValueToCurrency(value)

  expect(value_formated).toBe("12.34");
});

test('generateUUID', () => {
  const uuid = generateUUID();
  const contains = uuid.includes('-4');
  expect(contains).toBeTruthy();
  expect(uuid.length).toBe(36);
});
